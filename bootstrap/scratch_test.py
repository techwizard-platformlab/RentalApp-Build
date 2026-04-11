import re
val = '\"rentaleusacrcavcl4.azurecr.io\"'
m = re.match(r'^[\"\'](.+)[\"\']$', val)
print('MATCHED' if m else 'NO MATCH')
if m: print(m.group(1))
