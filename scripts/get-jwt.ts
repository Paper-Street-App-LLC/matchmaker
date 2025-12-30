#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Parse command line arguments
let args = {
	email: 'test@matchmaker.dev',
	password: 'password123',
	name: 'Test Matchmaker',
	updateConfig: false,
	existing: false,
}

for (let i = 2; i < process.argv.length; i++) {
	let arg = process.argv[i]
	if (arg === '--email' && i + 1 < process.argv.length) {
		args.email = process.argv[++i]
	} else if (arg === '--password' && i + 1 < process.argv.length) {
		args.password = process.argv[++i]
	} else if (arg === '--name' && i + 1 < process.argv.length) {
		args.name = process.argv[++i]
	} else if (arg === '--update-config') {
		args.updateConfig = true
	} else if (arg === '--existing') {
		args.existing = true
	}
}

async function main() {
	console.error('🔑 Matchmaker JWT Token Generator\n')

	// Load environment variables from backend/.env
	let envPath = join(process.cwd(), 'backend', '.env')
	if (!existsSync(envPath)) {
		console.error('❌ Error: backend/.env file not found')
		console.error('   Please create backend/.env with your Supabase credentials')
		console.error('   See docs/SETUP.md for instructions\n')
		process.exit(1)
	}

	let envContent = readFileSync(envPath, 'utf-8')
	let supabaseUrl = envContent.match(/SUPABASE_URL=(.+)/)?.[1]
	let supabaseKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]

	if (!supabaseUrl || !supabaseKey) {
		console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env\n')
		process.exit(1)
	}

	console.error(`📡 Connecting to Supabase: ${supabaseUrl}`)

	// Create Supabase client with service role key (admin access)
	let supabase = createClient(supabaseUrl, supabaseKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	})

	let userId: string | undefined

	if (!args.existing) {
		// Create user via Admin API
		console.error(`👤 Creating user: ${args.email}`)

		let { data: userData, error: userError } = await supabase.auth.admin.createUser({
			email: args.email,
			password: args.password,
			email_confirm: true, // Skip email confirmation
		})

		if (userError) {
			if (userError.message.includes('already') || userError.message.includes('exists')) {
				console.error(`⚠️  User already exists, trying to sign in instead...`)
				// Continue to sign in
			} else {
				console.error(`❌ Error creating user: ${userError.message}\n`)
				process.exit(1)
			}
		} else if (userData.user) {
			console.error(`✅ User created: ${userData.user.id}`)
			userId = userData.user.id

			// Create matchmaker record
			console.error(`📝 Creating matchmaker record...`)

			let { error: matchmakerError } = await supabase.from('matchmakers').insert({
				id: userId,
				name: args.name,
			})

			if (matchmakerError) {
				if (
					matchmakerError.message.includes('duplicate') ||
					matchmakerError.message.includes('already exists')
				) {
					console.error(`⚠️  Matchmaker record already exists`)
				} else {
					console.error(`❌ Error creating matchmaker: ${matchmakerError.message}\n`)
					process.exit(1)
				}
			} else {
				console.error(`✅ Matchmaker record created`)
			}
		}
	}

	// Sign in to get JWT token (this will also give us the userId)
	console.error(`🔐 Signing in to get JWT token...`)

	let { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
		email: args.email,
		password: args.password,
	})

	if (signInError || !sessionData.session) {
		console.error(`❌ Error signing in: ${signInError?.message || 'No session returned'}\n`)
		process.exit(1)
	}

	userId = sessionData.user.id

	// If user existed but no matchmaker record, create it now
	if (!args.existing) {
		console.error(`📝 Checking matchmaker record...`)

		let { data: existingMatchmaker } = await supabase
			.from('matchmakers')
			.select('id')
			.eq('id', userId)
			.single()

		if (!existingMatchmaker) {
			console.error(`📝 Creating matchmaker record...`)
			let { error: matchmakerError } = await supabase.from('matchmakers').insert({
				id: userId,
				name: args.name,
			})

			if (matchmakerError) {
				console.error(`❌ Error creating matchmaker: ${matchmakerError.message}\n`)
				process.exit(1)
			}
			console.error(`✅ Matchmaker record created`)
		} else {
			console.error(`✅ Matchmaker record already exists`)
		}
	}

	let jwtToken = sessionData.session.access_token
	let expiresAt = new Date((sessionData.session.expires_at ?? 0) * 1000)

	console.error(`✅ Successfully obtained JWT token`)
	console.error(`⏰ Token expires at: ${expiresAt.toLocaleString()}\n`)

	// Display JWT token
	console.error('━'.repeat(80))
	console.log(jwtToken)
	console.error('━'.repeat(80))
	console.error('')

	// Update MCP config if requested
	if (args.updateConfig) {
		let homeDir = process.env.HOME
		if (!homeDir) {
			console.error('❌ Error: HOME environment variable not set\n')
			process.exit(1)
		}
		let configDir = join(homeDir, '.config', 'matchmaker-mcp')
		let configPath = join(configDir, 'config.json')

		// Create directory if it doesn't exist
		if (!existsSync(configDir)) {
			mkdirSync(configDir, { recursive: true })
		}

		// Backup existing config
		if (existsSync(configPath)) {
			let backupPath = `${configPath}.backup`
			copyFileSync(configPath, backupPath)
			console.error(`📋 Backed up existing config to: ${backupPath}`)
		}

		// Write new config
		let config = {
			api_base_url: 'http://localhost:3000',
			auth_token: jwtToken,
		}

		writeFileSync(configPath, JSON.stringify(config, null, 2))
		console.error(`✅ JWT token saved to: ${configPath}`)
		console.error('')
		console.error('🔄 Restart Claude Desktop to use the new token\n')
	} else {
		console.error('💡 Tip: Add --update-config to automatically update your MCP config\n')
	}
}

main().catch((error) => {
	console.error(`❌ Fatal error: ${error.message}`)
	process.exit(1)
})
