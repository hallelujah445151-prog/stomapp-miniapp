import openpyxl, json

wb = openpyxl.load_workbook(r'C:\Users\crush\Downloads\Telegram Desktop\Прайс Лаборатория.xlsx')
ws = wb.active

work_types = []
for row in ws.iter_rows(min_col=2, max_col=2, values_only=True):
    name = str(row[0]).strip() if row[0] else ''
    if name and name.lower() not in ('наименование', 'название', 'вид работы', 'услуга', 'none', ''):
        short = name[:25] + ('...' if len(name) > 25 else '')
        work_types.append({'id': len(work_types)+1, 'name': name, 'short_name': short})
wb.close()

refs_path_local = r'C:\Users\crush\AppData\Roaming\projects\basestom\data\references.json'
refs_path_app = r'C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\backend\data\references.json'

with open(refs_path_local, 'r', encoding='utf-8') as f:
    refs = json.load(f)
refs['work_types'] = work_types

for path in [refs_path_local, refs_path_app]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(refs, f, ensure_ascii=False, indent=4)

print(f'Done: {len(work_types)} work types')
for wt in work_types:
    print(f"  {wt['id']}. {wt['name']}")
