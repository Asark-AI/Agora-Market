import os

with open('firestore rules.txt', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('request.resource.data.uid == uid', 'request.resource.data.id == uid')
content = content.replace('unchanged("uid")', 'unchanged("id")')
content = content.replace('request.resource.data.admin != true', '(!("admin" in request.resource.data) || request.resource.data.admin != true)')
content = content.replace('request.resource.data.superAdmin != true', '(!("superAdmin" in request.resource.data) || request.resource.data.superAdmin != true)')

with open('firestore.rules', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully updated firestore.rules')
