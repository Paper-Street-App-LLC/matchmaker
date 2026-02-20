-- Seed data: 150 diverse single profiles for cross-matchmaker matching
-- All records have is_seed = true and matchmaker_id = NULL
-- Preferences use the structured format: { aboutMe, lookingFor, dealBreakers }

INSERT INTO public.people (name, age, gender, location, preferences, is_seed, active, matchmaker_id)
VALUES

-- ============================================================
-- MEN (75 profiles)
-- ============================================================

('James Okafor', 32, 'male', 'New York, NY',
 '{"aboutMe":{"height":183,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Software Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":25,"max":38},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking","heavy drinking"]}',
 true, true, NULL),

('Marcus Chen', 29, 'male', 'San Francisco, CA',
 '{"aboutMe":{"height":175,"build":"slim","fitnessLevel":"moderate","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Product Manager","income":"100k-200k"},"lookingFor":{"ageRange":{"min":24,"max":35},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('David Reyes', 35, 'male', 'Los Angeles, CA',
 '{"aboutMe":{"height":178,"build":"average","fitnessLevel":"light","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Film Director","income":"100k-200k"},"lookingFor":{"ageRange":{"min":27,"max":42},"religionRequired":false,"wantsChildren":false},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('Noah Williams', 27, 'male', 'Chicago, IL',
 '{"aboutMe":{"height":188,"build":"athletic","fitnessLevel":"very_active","ethnicity":"White","religion":"Atheist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Personal Trainer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":23,"max":34},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["sedentary lifestyle","smoking"]}',
 true, true, NULL),

('Aiden Patel', 33, 'male', 'Houston, TX',
 '{"aboutMe":{"height":173,"build":"average","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Cardiologist","income":">200k"},"lookingFor":{"ageRange":{"min":26,"max":38},"religionRequired":true,"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Elijah Thompson', 31, 'male', 'Atlanta, GA',
 '{"aboutMe":{"height":185,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Attorney","income":">200k"},"lookingFor":{"ageRange":{"min":25,"max":38},"religionRequired":false,"wantsChildren":true},"dealBreakers":["dishonesty","smoking"]}',
 true, true, NULL),

('Benjamin Kim', 28, 'male', 'Seattle, WA',
 '{"aboutMe":{"height":177,"build":"slim","fitnessLevel":"moderate","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Data Scientist","income":"100k-200k"},"lookingFor":{"ageRange":{"min":23,"max":33},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Samuel Adeyemi', 36, 'male', 'Dallas, TX',
 '{"aboutMe":{"height":181,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":true,"numberOfChildren":1,"isDivorced":true,"isSmoker":false,"occupation":"Entrepreneur","income":">200k"},"lookingFor":{"ageRange":{"min":28,"max":42},"wantsChildren":true},"dealBreakers":["drugs","smoking"]}',
 true, true, NULL),

('Liam Nguyen', 30, 'male', 'Phoenix, AZ',
 '{"aboutMe":{"height":170,"build":"slim","fitnessLevel":"light","ethnicity":"Southeast Asian","religion":"Buddhist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Graphic Designer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":25,"max":36},"religionRequired":false,"wantsChildren":false},"dealBreakers":["smoking","negativity"]}',
 true, true, NULL),

('Ethan Rivera', 34, 'male', 'Miami, FL',
 '{"aboutMe":{"height":180,"build":"average","fitnessLevel":"moderate","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Real Estate Agent","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":40},"wantsChildren":true},"dealBreakers":["infidelity"]}',
 true, true, NULL),

('Jackson Brown', 26, 'male', 'Denver, CO',
 '{"aboutMe":{"height":182,"build":"athletic","fitnessLevel":"very_active","ethnicity":"White","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Mountain Guide","income":"30k-60k"},"lookingFor":{"ageRange":{"min":23,"max":33},"fitnessPreference":["moderate","active","very_active"],"wantsChildren":true},"dealBreakers":["sedentary lifestyle"]}',
 true, true, NULL),

('Alexander Goldstein', 38, 'male', 'New York, NY',
 '{"aboutMe":{"height":176,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Investment Banker","income":">200k"},"lookingFor":{"ageRange":{"min":28,"max":42},"religionRequired":true,"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Michael O''Brien', 40, 'male', 'Boston, MA',
 '{"aboutMe":{"height":180,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Catholic","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Professor","income":"60k-100k"},"lookingFor":{"ageRange":{"min":32,"max":45},"wantsChildren":false},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Ryan Kapoor', 29, 'male', 'San Jose, CA',
 '{"aboutMe":{"height":172,"build":"slim","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Software Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":24,"max":34},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Daniel Park', 33, 'male', 'Los Angeles, CA',
 '{"aboutMe":{"height":174,"build":"slim","fitnessLevel":"active","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Architect","income":"60k-100k"},"lookingFor":{"ageRange":{"min":26,"max":38},"wantsChildren":true},"dealBreakers":["smoking","closed-mindedness"]}',
 true, true, NULL),

('Chris Martinez', 31, 'male', 'San Antonio, TX',
 '{"aboutMe":{"height":178,"build":"average","fitnessLevel":"moderate","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Nurse","income":"60k-100k"},"lookingFor":{"ageRange":{"min":25,"max":37},"wantsChildren":true},"dealBreakers":["cheating"]}',
 true, true, NULL),

('Jordan Smith', 37, 'male', 'Philadelphia, PA',
 '{"aboutMe":{"height":183,"build":"heavyset","fitnessLevel":"sedentary","ethnicity":"Black","religion":"Christian","hasChildren":true,"numberOfChildren":1,"isDivorced":false,"isSmoker":false,"occupation":"Accountant","income":"60k-100k"},"lookingFor":{"ageRange":{"min":30,"max":44},"wantsChildren":false},"dealBreakers":["drugs","smoking"]}',
 true, true, NULL),

('Tyler Anderson', 25, 'male', 'Portland, OR',
 '{"aboutMe":{"height":179,"build":"slim","fitnessLevel":"active","ethnicity":"White","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Barista/Musician","income":"<30k"},"lookingFor":{"ageRange":{"min":22,"max":32},"wantsChildren":false},"dealBreakers":["corporate mindset"]}',
 true, true, NULL),

('Nathan Osei', 34, 'male', 'Washington, DC',
 '{"aboutMe":{"height":184,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Policy Analyst","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":40},"wantsChildren":true},"dealBreakers":["smoking","apathy"]}',
 true, true, NULL),

('Jake Hoffman', 42, 'male', 'Chicago, IL',
 '{"aboutMe":{"height":177,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Jewish","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Dentist","income":">200k"},"lookingFor":{"ageRange":{"min":33,"max":47},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Carlos Vega', 28, 'male', 'El Paso, TX',
 '{"aboutMe":{"height":175,"build":"average","fitnessLevel":"moderate","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Civil Engineer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":23,"max":34},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Sean Murphy', 39, 'male', 'Nashville, TN',
 '{"aboutMe":{"height":181,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Catholic","hasChildren":true,"numberOfChildren":1,"isDivorced":false,"isSmoker":false,"occupation":"Country Songwriter","income":"60k-100k"},"lookingFor":{"ageRange":{"min":30,"max":45},"wantsChildren":false},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('Anthony Brooks', 44, 'male', 'Detroit, MI',
 '{"aboutMe":{"height":185,"build":"heavyset","fitnessLevel":"light","ethnicity":"Black","religion":"Christian","hasChildren":true,"numberOfChildren":3,"isDivorced":true,"isSmoker":false,"occupation":"Automotive Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":35,"max":50},"wantsChildren":false},"dealBreakers":["smoking","irresponsibility"]}',
 true, true, NULL),

('Kevin Zhang', 27, 'male', 'Austin, TX',
 '{"aboutMe":{"height":173,"build":"slim","fitnessLevel":"moderate","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Startup Founder","income":"60k-100k"},"lookingFor":{"ageRange":{"min":23,"max":32},"wantsChildren":false},"dealBreakers":["lack of ambition"]}',
 true, true, NULL),

('Steven Johansson', 36, 'male', 'Minneapolis, MN',
 '{"aboutMe":{"height":187,"build":"athletic","fitnessLevel":"very_active","ethnicity":"White","religion":"Lutheran","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Physical Therapist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":28,"max":42},"fitnessPreference":["moderate","active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","laziness"]}',
 true, true, NULL),

('Isaac Hernandez', 32, 'male', 'Sacramento, CA',
 '{"aboutMe":{"height":176,"build":"average","fitnessLevel":"moderate","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Firefighter","income":"60k-100k"},"lookingFor":{"ageRange":{"min":25,"max":38},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Patrick Walsh', 45, 'male', 'San Diego, CA',
 '{"aboutMe":{"height":179,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Catholic","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Marine Biologist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":36,"max":50},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Omar Abdullah', 30, 'male', 'Dearborn, MI',
 '{"aboutMe":{"height":178,"build":"average","fitnessLevel":"moderate","ethnicity":"Arab","religion":"Muslim","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Pharmacist","income":"100k-200k"},"lookingFor":{"ageRange":{"min":24,"max":35},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking"]}',
 true, true, NULL),

('Raj Mehta', 35, 'male', 'Newark, NJ',
 '{"aboutMe":{"height":171,"build":"slim","fitnessLevel":"light","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Financial Analyst","income":"100k-200k"},"lookingFor":{"ageRange":{"min":27,"max":40},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Malik Jefferson', 29, 'male', 'Baltimore, MD',
 '{"aboutMe":{"height":186,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Black","religion":"Muslim","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Basketball Coach","income":"30k-60k"},"lookingFor":{"ageRange":{"min":23,"max":35},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking"]}',
 true, true, NULL),

('Greg Larson', 41, 'male', 'Salt Lake City, UT',
 '{"aboutMe":{"height":182,"build":"athletic","fitnessLevel":"active","ethnicity":"White","religion":"Mormon","hasChildren":true,"numberOfChildren":3,"isDivorced":false,"isSmoker":false,"occupation":"Financial Planner","income":"100k-200k"},"lookingFor":{"ageRange":{"min":30,"max":45},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking","premarital cohabitation"]}',
 true, true, NULL),

('Dmitri Volkov', 33, 'male', 'New York, NY',
 '{"aboutMe":{"height":180,"build":"average","fitnessLevel":"moderate","ethnicity":"Eastern European","religion":"Orthodox Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Software Architect","income":"100k-200k"},"lookingFor":{"ageRange":{"min":26,"max":38},"wantsChildren":true},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('Andre Tremblay', 37, 'male', 'New Orleans, LA',
 '{"aboutMe":{"height":178,"build":"average","fitnessLevel":"moderate","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Jazz Musician","income":"30k-60k"},"lookingFor":{"ageRange":{"min":28,"max":43},"wantsChildren":false},"dealBreakers":["close-mindedness"]}',
 true, true, NULL),

('Victor Huang', 31, 'male', 'San Francisco, CA',
 '{"aboutMe":{"height":175,"build":"slim","fitnessLevel":"active","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"UX Designer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":25,"max":37},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Felix Bauer', 43, 'male', 'Chicago, IL',
 '{"aboutMe":{"height":183,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":1,"isDivorced":true,"isSmoker":false,"occupation":"Restaurant Owner","income":"100k-200k"},"lookingFor":{"ageRange":{"min":34,"max":50},"wantsChildren":false},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('William Turner', 26, 'male', 'Charlotte, NC',
 '{"aboutMe":{"height":180,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Sports Trainer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":22,"max":32},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Leo Rosenberg', 38, 'male', 'Los Angeles, CA',
 '{"aboutMe":{"height":176,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Entertainment Lawyer","income":">200k"},"lookingFor":{"ageRange":{"min":28,"max":42},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Hassan Mwangi', 34, 'male', 'Columbus, OH',
 '{"aboutMe":{"height":184,"build":"athletic","fitnessLevel":"active","ethnicity":"East African","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Civil Rights Attorney","income":"100k-200k"},"lookingFor":{"ageRange":{"min":27,"max":40},"wantsChildren":true},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Matthew Gupta', 30, 'male', 'Washington, DC',
 '{"aboutMe":{"height":174,"build":"slim","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Journalist","income":"30k-60k"},"lookingFor":{"ageRange":{"min":24,"max":36},"religionRequired":false,"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Oliver James', 46, 'male', 'Seattle, WA',
 '{"aboutMe":{"height":181,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Software VP","income":">200k"},"lookingFor":{"ageRange":{"min":36,"max":50},"wantsChildren":false},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Diego Flores', 27, 'male', 'Denver, CO',
 '{"aboutMe":{"height":177,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Ski Instructor","income":"<30k"},"lookingFor":{"ageRange":{"min":22,"max":33},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["sedentary lifestyle"]}',
 true, true, NULL),

('Aaron Cohen', 39, 'male', 'New York, NY',
 '{"aboutMe":{"height":178,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Therapist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":30,"max":45},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Brendan O''Sullivan', 32, 'male', 'Boston, MA',
 '{"aboutMe":{"height":182,"build":"athletic","fitnessLevel":"active","ethnicity":"White","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Paramedic","income":"30k-60k"},"lookingFor":{"ageRange":{"min":25,"max":38},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Jun Nakamura', 28, 'male', 'Los Angeles, CA',
 '{"aboutMe":{"height":172,"build":"slim","fitnessLevel":"moderate","ethnicity":"East Asian","religion":"Shinto","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Game Developer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":23,"max":33},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Malcolm Hayes', 36, 'male', 'Atlanta, GA',
 '{"aboutMe":{"height":188,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"NFL Strength Coach","income":"100k-200k"},"lookingFor":{"ageRange":{"min":27,"max":42},"fitnessPreference":["moderate","active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Tom Sullivan', 48, 'male', 'Phoenix, AZ',
 '{"aboutMe":{"height":180,"build":"heavyset","fitnessLevel":"sedentary","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Retired Military","income":"60k-100k"},"lookingFor":{"ageRange":{"min":38,"max":53},"wantsChildren":false},"dealBreakers":["drugs"]}',
 true, true, NULL),

('Kwame Asante', 31, 'male', 'Houston, TX',
 '{"aboutMe":{"height":180,"build":"athletic","fitnessLevel":"active","ethnicity":"West African","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Supply Chain Manager","income":"60k-100k"},"lookingFor":{"ageRange":{"min":24,"max":37},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Adrian Petrov', 35, 'male', 'Chicago, IL',
 '{"aboutMe":{"height":180,"build":"average","fitnessLevel":"moderate","ethnicity":"Eastern European","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Economist","income":"100k-200k"},"lookingFor":{"ageRange":{"min":27,"max":40},"wantsChildren":true},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('Hiro Tanaka', 29, 'male', 'San Jose, CA',
 '{"aboutMe":{"height":171,"build":"slim","fitnessLevel":"active","ethnicity":"East Asian","religion":"Buddhist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Robotics Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":24,"max":34},"religionRequired":false,"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Tobias Richter', 33, 'male', 'New York, NY',
 '{"aboutMe":{"height":184,"build":"slim","fitnessLevel":"moderate","ethnicity":"White","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Journalist","income":"30k-60k"},"lookingFor":{"ageRange":{"min":26,"max":38},"wantsChildren":false},"dealBreakers":["close-mindedness"]}',
 true, true, NULL),

('Jamal Foster', 40, 'male', 'Philadelphia, PA',
 '{"aboutMe":{"height":183,"build":"average","fitnessLevel":"light","ethnicity":"Black","religion":"Muslim","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"High School Principal","income":"60k-100k"},"lookingFor":{"ageRange":{"min":32,"max":46},"religionRequired":true,"wantsChildren":false},"dealBreakers":["alcohol","smoking"]}',
 true, true, NULL),

('Nick Papadopoulos', 37, 'male', 'New York, NY',
 '{"aboutMe":{"height":177,"build":"average","fitnessLevel":"moderate","ethnicity":"Greek","religion":"Orthodox Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Restaurant Owner","income":"100k-200k"},"lookingFor":{"ageRange":{"min":28,"max":42},"wantsChildren":true},"dealBreakers":["smoking","irresponsibility"]}',
 true, true, NULL),

('Luis Mendoza', 25, 'male', 'Miami, FL',
 '{"aboutMe":{"height":176,"build":"athletic","fitnessLevel":"active","ethnicity":"Latino","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Marine","income":"30k-60k"},"lookingFor":{"ageRange":{"min":22,"max":31},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Peter Christensen', 42, 'male', 'Minneapolis, MN',
 '{"aboutMe":{"height":183,"build":"athletic","fitnessLevel":"active","ethnicity":"White","religion":"Lutheran","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"Surgeon","income":">200k"},"lookingFor":{"ageRange":{"min":33,"max":48},"wantsChildren":false},"dealBreakers":["smoking","irresponsibility"]}',
 true, true, NULL),

('Derrick Washington', 34, 'male', 'Los Angeles, CA',
 '{"aboutMe":{"height":185,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Black","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Music Producer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":26,"max":40},"wantsChildren":false},"dealBreakers":["negativity"]}',
 true, true, NULL),

('Sanjay Krishnaswamy', 38, 'male', 'San Francisco, CA',
 '{"aboutMe":{"height":174,"build":"slim","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Tech Executive","income":">200k"},"lookingFor":{"ageRange":{"min":30,"max":44},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Dylan Mitchell', 26, 'male', 'Austin, TX',
 '{"aboutMe":{"height":178,"build":"slim","fitnessLevel":"moderate","ethnicity":"White","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Software Developer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":22,"max":32},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Gabriel Santos', 30, 'male', 'Newark, NJ',
 '{"aboutMe":{"height":176,"build":"average","fitnessLevel":"moderate","ethnicity":"Latino","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Healthcare Administrator","income":"60k-100k"},"lookingFor":{"ageRange":{"min":24,"max":36},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Evan Price', 44, 'male', 'Portland, OR',
 '{"aboutMe":{"height":180,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":1,"isDivorced":true,"isSmoker":false,"occupation":"Architect","income":"100k-200k"},"lookingFor":{"ageRange":{"min":35,"max":50},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Benson Okoye', 29, 'male', 'Dallas, TX',
 '{"aboutMe":{"height":182,"build":"athletic","fitnessLevel":"active","ethnicity":"Nigerian","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Petroleum Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":24,"max":35},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Eli Steinberg', 31, 'male', 'Chicago, IL',
 '{"aboutMe":{"height":175,"build":"slim","fitnessLevel":"moderate","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Radiologist","income":">200k"},"lookingFor":{"ageRange":{"min":25,"max":37},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Cody Hansen', 27, 'male', 'Boise, ID',
 '{"aboutMe":{"height":183,"build":"athletic","fitnessLevel":"very_active","ethnicity":"White","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Search and Rescue","income":"30k-60k"},"lookingFor":{"ageRange":{"min":23,"max":33},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Marco Bellini', 36, 'male', 'New York, NY',
 '{"aboutMe":{"height":178,"build":"average","fitnessLevel":"moderate","ethnicity":"Italian","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Executive Chef","income":"60k-100k"},"lookingFor":{"ageRange":{"min":28,"max":42},"wantsChildren":true},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('Fred Owusu', 32, 'male', 'Washington, DC',
 '{"aboutMe":{"height":179,"build":"athletic","fitnessLevel":"active","ethnicity":"Ghanaian","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Diplomat","income":"60k-100k"},"lookingFor":{"ageRange":{"min":25,"max":38},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Adam Levy', 47, 'male', 'San Francisco, CA',
 '{"aboutMe":{"height":176,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Jewish","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"VC Partner","income":">200k"},"lookingFor":{"ageRange":{"min":37,"max":52},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Yusuf Idris', 35, 'male', 'Houston, TX',
 '{"aboutMe":{"height":181,"build":"average","fitnessLevel":"moderate","ethnicity":"Somali","religion":"Muslim","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Nurse Practitioner","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":40},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking"]}',
 true, true, NULL),

('Paul Lambert', 50, 'male', 'New Orleans, LA',
 '{"aboutMe":{"height":180,"build":"heavyset","fitnessLevel":"sedentary","ethnicity":"White","religion":"Catholic","hasChildren":true,"numberOfChildren":3,"isDivorced":true,"isSmoker":false,"occupation":"Retired Teacher","income":"30k-60k"},"lookingFor":{"ageRange":{"min":40,"max":55},"wantsChildren":false},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Ricky Nakamura', 28, 'male', 'Honolulu, HI',
 '{"aboutMe":{"height":172,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Japanese","religion":"Shinto","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Surfer/Instructor","income":"<30k"},"lookingFor":{"ageRange":{"min":23,"max":34},"fitnessPreference":["active","very_active"],"wantsChildren":false},"dealBreakers":["sedentary lifestyle"]}',
 true, true, NULL),

('Jeremy Cassidy', 38, 'male', 'Kansas City, MO',
 '{"aboutMe":{"height":179,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Christian","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"Veterinarian","income":"100k-200k"},"lookingFor":{"ageRange":{"min":30,"max":44},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

-- ============================================================
-- WOMEN (75 profiles)
-- ============================================================

('Amara Diallo', 28, 'female', 'New York, NY',
 '{"aboutMe":{"height":165,"build":"slim","fitnessLevel":"active","ethnicity":"West African","religion":"Muslim","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Fashion Designer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":28,"max":40},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking","disrespect"]}',
 true, true, NULL),

('Sofia Rodriguez', 31, 'female', 'Los Angeles, CA',
 '{"aboutMe":{"height":163,"build":"curvy","fitnessLevel":"moderate","ethnicity":"Latina","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Immigration Lawyer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":29,"max":42},"wantsChildren":true},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Priya Sharma', 27, 'female', 'San Jose, CA',
 '{"aboutMe":{"height":160,"build":"slim","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Biotech Researcher","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":37},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Rachel Kim', 33, 'female', 'Seattle, WA',
 '{"aboutMe":{"height":162,"build":"athletic","fitnessLevel":"active","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Marketing Director","income":"100k-200k"},"lookingFor":{"ageRange":{"min":30,"max":42},"wantsChildren":true},"dealBreakers":["smoking","lack of ambition"]}',
 true, true, NULL),

('Maya Johnson', 29, 'female', 'Chicago, IL',
 '{"aboutMe":{"height":168,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Physical Therapist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":28,"max":38},"fitnessPreference":["moderate","active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","couch potato"]}',
 true, true, NULL),

('Emma Chen', 26, 'female', 'San Francisco, CA',
 '{"aboutMe":{"height":158,"build":"slim","fitnessLevel":"moderate","ethnicity":"East Asian","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Software Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":26,"max":36},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Isabella Moretti', 35, 'female', 'Miami, FL',
 '{"aboutMe":{"height":166,"build":"curvy","fitnessLevel":"light","ethnicity":"Italian","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Interior Designer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":33,"max":46},"wantsChildren":true},"dealBreakers":["dishonesty","commitment issues"]}',
 true, true, NULL),

('Aisha Williams', 30, 'female', 'Atlanta, GA',
 '{"aboutMe":{"height":170,"build":"average","fitnessLevel":"moderate","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Pediatric Nurse","income":"60k-100k"},"lookingFor":{"ageRange":{"min":28,"max":40},"wantsChildren":true},"dealBreakers":["smoking","drugs","irresponsibility"]}',
 true, true, NULL),

('Natalie Fischer', 37, 'female', 'New York, NY',
 '{"aboutMe":{"height":167,"build":"slim","fitnessLevel":"active","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Obstetrician","income":">200k"},"lookingFor":{"ageRange":{"min":34,"max":47},"religionRequired":true,"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Valentina Cruz', 25, 'female', 'San Antonio, TX',
 '{"aboutMe":{"height":161,"build":"average","fitnessLevel":"moderate","ethnicity":"Latina","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Elementary Teacher","income":"30k-60k"},"lookingFor":{"ageRange":{"min":26,"max":36},"wantsChildren":true},"dealBreakers":["smoking","unkindness"]}',
 true, true, NULL),

('Grace Lee', 32, 'female', 'Los Angeles, CA',
 '{"aboutMe":{"height":163,"build":"slim","fitnessLevel":"active","ethnicity":"East Asian","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Film Producer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":30,"max":42},"wantsChildren":false},"dealBreakers":["smoking","laziness"]}',
 true, true, NULL),

('Fatima Al-Hassan', 29, 'female', 'Dearborn, MI',
 '{"aboutMe":{"height":164,"build":"average","fitnessLevel":"light","ethnicity":"Arab","religion":"Muslim","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Pediatrician","income":"100k-200k"},"lookingFor":{"ageRange":{"min":29,"max":40},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking"]}',
 true, true, NULL),

('Stephanie Baker', 40, 'female', 'Boston, MA',
 '{"aboutMe":{"height":165,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":1,"isDivorced":true,"isSmoker":false,"occupation":"Clinical Psychologist","income":"100k-200k"},"lookingFor":{"ageRange":{"min":37,"max":50},"wantsChildren":false},"dealBreakers":["smoking","emotional unavailability"]}',
 true, true, NULL),

('Keisha Banks', 34, 'female', 'Houston, TX',
 '{"aboutMe":{"height":169,"build":"curvy","fitnessLevel":"moderate","ethnicity":"Black","religion":"Baptist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Marketing Manager","income":"60k-100k"},"lookingFor":{"ageRange":{"min":32,"max":44},"wantsChildren":true},"dealBreakers":["smoking","infidelity"]}',
 true, true, NULL),

('Anna Petersen', 28, 'female', 'Minneapolis, MN',
 '{"aboutMe":{"height":168,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Scandinavian","religion":"Lutheran","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Olympic Hopeful (Biathlon)","income":"<30k"},"lookingFor":{"ageRange":{"min":27,"max":36},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["sedentary lifestyle","smoking"]}',
 true, true, NULL),

('Nadia Petrova', 33, 'female', 'New York, NY',
 '{"aboutMe":{"height":165,"build":"slim","fitnessLevel":"active","ethnicity":"Eastern European","religion":"Orthodox Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Ballet Dancer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":30,"max":42},"wantsChildren":true},"dealBreakers":["smoking","unreliability"]}',
 true, true, NULL),

('Chloe Turner', 26, 'female', 'Nashville, TN',
 '{"aboutMe":{"height":162,"build":"slim","fitnessLevel":"moderate","ethnicity":"White","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Country Singer/Songwriter","income":"30k-60k"},"lookingFor":{"ageRange":{"min":26,"max":38},"wantsChildren":true},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Monica Adeyemi', 36, 'female', 'Washington, DC',
 '{"aboutMe":{"height":168,"build":"athletic","fitnessLevel":"active","ethnicity":"Nigerian","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Foreign Service Officer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":33,"max":45},"wantsChildren":true},"dealBreakers":["smoking","immaturity"]}',
 true, true, NULL),

('Hannah Goldberg', 31, 'female', 'Los Angeles, CA',
 '{"aboutMe":{"height":163,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Screenwriter","income":"60k-100k"},"lookingFor":{"ageRange":{"min":30,"max":42},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Elena Vasquez', 29, 'female', 'Dallas, TX',
 '{"aboutMe":{"height":164,"build":"curvy","fitnessLevel":"light","ethnicity":"Latina","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Nurse Anesthetist","income":"100k-200k"},"lookingFor":{"ageRange":{"min":28,"max":40},"wantsChildren":true},"dealBreakers":["smoking","cheating"]}',
 true, true, NULL),

('Serena Powell', 42, 'female', 'Chicago, IL',
 '{"aboutMe":{"height":170,"build":"curvy","fitnessLevel":"moderate","ethnicity":"Black","religion":"Christian","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"High School Principal","income":"60k-100k"},"lookingFor":{"ageRange":{"min":38,"max":52},"wantsChildren":false},"dealBreakers":["smoking","immaturity"]}',
 true, true, NULL),

('Julie Nakamura', 34, 'female', 'Seattle, WA',
 '{"aboutMe":{"height":160,"build":"slim","fitnessLevel":"moderate","ethnicity":"Japanese American","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"UX Researcher","income":"100k-200k"},"lookingFor":{"ageRange":{"min":31,"max":43},"wantsChildren":false},"dealBreakers":["smoking","close-mindedness"]}',
 true, true, NULL),

('Alexis Cooper', 27, 'female', 'Denver, CO',
 '{"aboutMe":{"height":167,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Entrepreneur","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":38},"wantsChildren":true},"dealBreakers":["smoking","lack of ambition"]}',
 true, true, NULL),

('Rina Kapoor', 30, 'female', 'San Francisco, CA',
 '{"aboutMe":{"height":157,"build":"slim","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Data Scientist","income":"100k-200k"},"lookingFor":{"ageRange":{"min":29,"max":40},"religionRequired":false,"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Sarah O''Connor', 38, 'female', 'Boston, MA',
 '{"aboutMe":{"height":166,"build":"average","fitnessLevel":"light","ethnicity":"Irish American","religion":"Catholic","hasChildren":true,"numberOfChildren":1,"isDivorced":true,"isSmoker":false,"occupation":"Trial Attorney","income":">200k"},"lookingFor":{"ageRange":{"min":35,"max":48},"wantsChildren":false},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Jasmine Edwards', 25, 'female', 'Atlanta, GA',
 '{"aboutMe":{"height":168,"build":"slim","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Medical Student","income":"<30k"},"lookingFor":{"ageRange":{"min":25,"max":35},"wantsChildren":true},"dealBreakers":["smoking","drugs","irresponsibility"]}',
 true, true, NULL),

('Leah Silverman', 35, 'female', 'New York, NY',
 '{"aboutMe":{"height":163,"build":"slim","fitnessLevel":"active","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Investment Banker","income":">200k"},"lookingFor":{"ageRange":{"min":33,"max":46},"religionRequired":true,"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Carmen Reyes', 32, 'female', 'Miami, FL',
 '{"aboutMe":{"height":164,"build":"curvy","fitnessLevel":"moderate","ethnicity":"Cuban","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Cardiologist","income":">200k"},"lookingFor":{"ageRange":{"min":30,"max":42},"wantsChildren":true},"dealBreakers":["smoking","infidelity"]}',
 true, true, NULL),

('Tanya Lewis', 44, 'female', 'Philadelphia, PA',
 '{"aboutMe":{"height":167,"build":"average","fitnessLevel":"moderate","ethnicity":"Black","religion":"Baptist","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Real Estate Developer","income":">200k"},"lookingFor":{"ageRange":{"min":40,"max":55},"wantsChildren":false},"dealBreakers":["smoking","instability"]}',
 true, true, NULL),

('Mei Lin Wu', 28, 'female', 'Los Angeles, CA',
 '{"aboutMe":{"height":157,"build":"slim","fitnessLevel":"moderate","ethnicity":"Chinese","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Fashion Buyer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":38},"wantsChildren":false},"dealBreakers":["smoking","controlling behavior"]}',
 true, true, NULL),

('Destiny Thompson', 26, 'female', 'Houston, TX',
 '{"aboutMe":{"height":166,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Track Athlete","income":"<30k"},"lookingFor":{"ageRange":{"min":26,"max":36},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","laziness"]}',
 true, true, NULL),

('Amanda Walsh', 39, 'female', 'Portland, OR',
 '{"aboutMe":{"height":164,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":1,"isDivorced":false,"isSmoker":false,"occupation":"Environmental Scientist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":35,"max":48},"wantsChildren":false},"dealBreakers":["close-mindedness about environment"]}',
 true, true, NULL),

('Yuki Tanaka', 31, 'female', 'San Francisco, CA',
 '{"aboutMe":{"height":158,"build":"slim","fitnessLevel":"active","ethnicity":"Japanese","religion":"Buddhist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Product Designer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":29,"max":40},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Rebecca Martinez', 45, 'female', 'San Antonio, TX',
 '{"aboutMe":{"height":163,"build":"curvy","fitnessLevel":"light","ethnicity":"Latina","religion":"Catholic","hasChildren":true,"numberOfChildren":3,"isDivorced":true,"isSmoker":false,"occupation":"Nurse Manager","income":"60k-100k"},"lookingFor":{"ageRange":{"min":42,"max":55},"wantsChildren":false},"dealBreakers":["smoking","irresponsibility"]}',
 true, true, NULL),

('Diana Prince', 33, 'female', 'Washington, DC',
 '{"aboutMe":{"height":168,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Black","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Pentagon Policy Advisor","income":"100k-200k"},"lookingFor":{"ageRange":{"min":31,"max":43},"wantsChildren":true},"dealBreakers":["smoking","lack of integrity"]}',
 true, true, NULL),

('Laura Weber', 36, 'female', 'Chicago, IL',
 '{"aboutMe":{"height":165,"build":"average","fitnessLevel":"moderate","ethnicity":"German American","religion":"Lutheran","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Pediatrician","income":">200k"},"lookingFor":{"ageRange":{"min":33,"max":46},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Sandra Williams', 48, 'female', 'Detroit, MI',
 '{"aboutMe":{"height":164,"build":"average","fitnessLevel":"light","ethnicity":"Black","religion":"Christian","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Hospital Administrator","income":"100k-200k"},"lookingFor":{"ageRange":{"min":44,"max":58},"wantsChildren":false},"dealBreakers":["smoking","immaturity"]}',
 true, true, NULL),

('Kira Okafor', 29, 'female', 'New York, NY',
 '{"aboutMe":{"height":167,"build":"slim","fitnessLevel":"active","ethnicity":"Nigerian British","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Human Rights Lawyer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":28,"max":40},"wantsChildren":true},"dealBreakers":["smoking","apathy"]}',
 true, true, NULL),

('Maggie Sullivan', 41, 'female', 'Boston, MA',
 '{"aboutMe":{"height":162,"build":"average","fitnessLevel":"moderate","ethnicity":"Irish American","religion":"Catholic","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"Social Worker","income":"30k-60k"},"lookingFor":{"ageRange":{"min":38,"max":52},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Ingrid Svensson', 30, 'female', 'Minneapolis, MN',
 '{"aboutMe":{"height":170,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Swedish American","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Sports Medicine Doctor","income":"100k-200k"},"lookingFor":{"ageRange":{"min":29,"max":40},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","laziness"]}',
 true, true, NULL),

('Camille Dubois', 34, 'female', 'New Orleans, LA',
 '{"aboutMe":{"height":165,"build":"slim","fitnessLevel":"moderate","ethnicity":"Creole","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Jazz Vocalist","income":"30k-60k"},"lookingFor":{"ageRange":{"min":31,"max":44},"wantsChildren":false},"dealBreakers":["dishonesty"]}',
 true, true, NULL),

('Zoe Nakamura', 27, 'female', 'Seattle, WA',
 '{"aboutMe":{"height":160,"build":"slim","fitnessLevel":"active","ethnicity":"Japanese American","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Environmental Engineer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":37},"wantsChildren":false},"dealBreakers":["smoking","environmental apathy"]}',
 true, true, NULL),

('Rosa Gutierrez', 43, 'female', 'Phoenix, AZ',
 '{"aboutMe":{"height":161,"build":"curvy","fitnessLevel":"light","ethnicity":"Mexican American","religion":"Catholic","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"School Counselor","income":"30k-60k"},"lookingFor":{"ageRange":{"min":40,"max":54},"wantsChildren":false},"dealBreakers":["smoking","cruelty"]}',
 true, true, NULL),

('Brittany Evans', 31, 'female', 'Nashville, TN',
 '{"aboutMe":{"height":165,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Veterinarian","income":"60k-100k"},"lookingFor":{"ageRange":{"min":29,"max":40},"wantsChildren":true},"dealBreakers":["animal cruelty","smoking"]}',
 true, true, NULL),

('Alicia Ramirez', 35, 'female', 'Los Angeles, CA',
 '{"aboutMe":{"height":163,"build":"athletic","fitnessLevel":"active","ethnicity":"Latina","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Personal Trainer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":33,"max":45},"fitnessPreference":["moderate","active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","laziness"]}',
 true, true, NULL),

('Helen Zhang', 46, 'female', 'San Francisco, CA',
 '{"aboutMe":{"height":159,"build":"slim","fitnessLevel":"moderate","ethnicity":"Chinese","religion":"Agnostic","hasChildren":true,"numberOfChildren":1,"isDivorced":true,"isSmoker":false,"occupation":"Tech Executive","income":">200k"},"lookingFor":{"ageRange":{"min":42,"max":56},"wantsChildren":false},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Olivia Washington', 28, 'female', 'Chicago, IL',
 '{"aboutMe":{"height":166,"build":"average","fitnessLevel":"moderate","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"CPA","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":38},"wantsChildren":true},"dealBreakers":["smoking","financial irresponsibility"]}',
 true, true, NULL),

('Nina Okafor', 32, 'female', 'Houston, TX',
 '{"aboutMe":{"height":167,"build":"slim","fitnessLevel":"active","ethnicity":"Igbo","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Software Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":30,"max":42},"wantsChildren":true},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Tiffany Brooks', 37, 'female', 'Atlanta, GA',
 '{"aboutMe":{"height":170,"build":"curvy","fitnessLevel":"moderate","ethnicity":"Black","religion":"Christian","hasChildren":true,"numberOfChildren":1,"isDivorced":false,"isSmoker":false,"occupation":"Broadcast Journalist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":34,"max":47},"wantsChildren":false},"dealBreakers":["smoking","instability"]}',
 true, true, NULL),

('Mia Johansson', 25, 'female', 'New York, NY',
 '{"aboutMe":{"height":163,"build":"slim","fitnessLevel":"active","ethnicity":"Swedish","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Ballerina","income":"<30k"},"lookingFor":{"ageRange":{"min":25,"max":35},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Katherine Singh', 39, 'female', 'Denver, CO',
 '{"aboutMe":{"height":164,"build":"average","fitnessLevel":"moderate","ethnicity":"South Asian","religion":"Hindu","hasChildren":false,"isDivorced":true,"isSmoker":false,"occupation":"OB-GYN","income":">200k"},"lookingFor":{"ageRange":{"min":36,"max":50},"wantsChildren":false},"dealBreakers":["smoking","immaturity"]}',
 true, true, NULL),

('Paige Monroe', 30, 'female', 'Dallas, TX',
 '{"aboutMe":{"height":165,"build":"slim","fitnessLevel":"active","ethnicity":"White","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Nurse","income":"60k-100k"},"lookingFor":{"ageRange":{"min":29,"max":40},"wantsChildren":true},"dealBreakers":["smoking","drugs"]}',
 true, true, NULL),

('Miriam Cohen', 36, 'female', 'New York, NY',
 '{"aboutMe":{"height":162,"build":"average","fitnessLevel":"light","ethnicity":"White","religion":"Jewish","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Therapist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":34,"max":47},"religionRequired":false,"wantsChildren":true},"dealBreakers":["emotional unavailability"]}',
 true, true, NULL),

('Crystal Davis', 33, 'female', 'Baltimore, MD',
 '{"aboutMe":{"height":168,"build":"curvy","fitnessLevel":"moderate","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Social Media Manager","income":"30k-60k"},"lookingFor":{"ageRange":{"min":31,"max":43},"wantsChildren":true},"dealBreakers":["smoking","negativity"]}',
 true, true, NULL),

('Samantha Pierce', 41, 'female', 'Portland, OR',
 '{"aboutMe":{"height":165,"build":"average","fitnessLevel":"moderate","ethnicity":"White","religion":"Agnostic","hasChildren":true,"numberOfChildren":2,"isDivorced":true,"isSmoker":false,"occupation":"Architect","income":"100k-200k"},"lookingFor":{"ageRange":{"min":38,"max":52},"wantsChildren":false},"dealBreakers":["smoking","dishonesty"]}',
 true, true, NULL),

('Bianca Costa', 27, 'female', 'Miami, FL',
 '{"aboutMe":{"height":164,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Brazilian","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Dance Instructor","income":"30k-60k"},"lookingFor":{"ageRange":{"min":26,"max":36},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["sedentary lifestyle","smoking"]}',
 true, true, NULL),

('Cynthia Hall', 44, 'female', 'Charlotte, NC',
 '{"aboutMe":{"height":167,"build":"average","fitnessLevel":"light","ethnicity":"Black","religion":"Baptist","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"Insurance Executive","income":"100k-200k"},"lookingFor":{"ageRange":{"min":40,"max":54},"wantsChildren":false},"dealBreakers":["smoking","financial problems"]}',
 true, true, NULL),

('Veronica Castillo', 31, 'female', 'El Paso, TX',
 '{"aboutMe":{"height":162,"build":"curvy","fitnessLevel":"light","ethnicity":"Mexican","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Bilingual Educator","income":"30k-60k"},"lookingFor":{"ageRange":{"min":29,"max":41},"wantsChildren":true},"dealBreakers":["cheating","smoking"]}',
 true, true, NULL),

('Sophia Johansson', 29, 'female', 'Chicago, IL',
 '{"aboutMe":{"height":169,"build":"slim","fitnessLevel":"active","ethnicity":"Finnish","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Architect","income":"60k-100k"},"lookingFor":{"ageRange":{"min":28,"max":40},"wantsChildren":false},"dealBreakers":["smoking","closed-mindedness"]}',
 true, true, NULL),

('Imani Jackson', 35, 'female', 'Washington, DC',
 '{"aboutMe":{"height":169,"build":"athletic","fitnessLevel":"active","ethnicity":"Black","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Congressional Staffer","income":"60k-100k"},"lookingFor":{"ageRange":{"min":32,"max":44},"wantsChildren":true},"dealBreakers":["smoking","apathy"]}',
 true, true, NULL),

('Adaeze Okeke', 27, 'female', 'Houston, TX',
 '{"aboutMe":{"height":165,"build":"slim","fitnessLevel":"moderate","ethnicity":"Igbo","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Accountant","income":"60k-100k"},"lookingFor":{"ageRange":{"min":27,"max":38},"wantsChildren":true},"dealBreakers":["smoking","irresponsibility"]}',
 true, true, NULL),

('Patricia Nguyen', 38, 'female', 'Los Angeles, CA',
 '{"aboutMe":{"height":157,"build":"slim","fitnessLevel":"moderate","ethnicity":"Vietnamese","religion":"Buddhist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Nutritionist","income":"30k-60k"},"lookingFor":{"ageRange":{"min":35,"max":48},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Fiona McMahon', 32, 'female', 'Boston, MA',
 '{"aboutMe":{"height":165,"build":"average","fitnessLevel":"moderate","ethnicity":"Irish","religion":"Catholic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Biomedical Engineer","income":"100k-200k"},"lookingFor":{"ageRange":{"min":30,"max":42},"wantsChildren":true},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Nia Mwamba', 26, 'female', 'Atlanta, GA',
 '{"aboutMe":{"height":166,"build":"athletic","fitnessLevel":"very_active","ethnicity":"Kenyan","religion":"Christian","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Long Distance Runner","income":"<30k"},"lookingFor":{"ageRange":{"min":26,"max":36},"fitnessPreference":["active","very_active"],"wantsChildren":true},"dealBreakers":["smoking","laziness"]}',
 true, true, NULL),

('Susan Park', 49, 'female', 'San Jose, CA',
 '{"aboutMe":{"height":158,"build":"slim","fitnessLevel":"moderate","ethnicity":"Korean","religion":"Christian","hasChildren":true,"numberOfChildren":2,"isDivorced":false,"isSmoker":false,"occupation":"Corporate Attorney","income":">200k"},"lookingFor":{"ageRange":{"min":45,"max":58},"wantsChildren":false},"dealBreakers":["smoking","irresponsibility"]}',
 true, true, NULL),

('Abby Crawford', 30, 'female', 'Salt Lake City, UT',
 '{"aboutMe":{"height":164,"build":"average","fitnessLevel":"active","ethnicity":"White","religion":"Mormon","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Dental Hygienist","income":"30k-60k"},"lookingFor":{"ageRange":{"min":28,"max":38},"religionRequired":true,"wantsChildren":true},"dealBreakers":["alcohol","smoking","drugs"]}',
 true, true, NULL),

('Tara O''Brien', 34, 'female', 'San Diego, CA',
 '{"aboutMe":{"height":166,"build":"average","fitnessLevel":"moderate","ethnicity":"Irish American","religion":"Agnostic","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Marine Biologist","income":"60k-100k"},"lookingFor":{"ageRange":{"min":31,"max":44},"wantsChildren":false},"dealBreakers":["smoking"]}',
 true, true, NULL),

('Danika Hooper', 28, 'female', 'Columbus, OH',
 '{"aboutMe":{"height":163,"build":"curvy","fitnessLevel":"light","ethnicity":"Black","religion":"Baptist","hasChildren":false,"isDivorced":false,"isSmoker":false,"occupation":"Graphic Designer","income":"30k-60k"},"lookingFor":{"ageRange":{"min":27,"max":38},"wantsChildren":true},"dealBreakers":["smoking","cheating"]}',
 true, true, NULL);
