SELECT u.id, u.email, u.name, om.organization_id, om.status 
FROM users u 
LEFT JOIN organization_members om ON u.id = om.user_id 
WHERE u.email = 'gabriel@gmail.com';
