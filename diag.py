import sys
sys.path.insert(0, '.')
from backend.app.core.database import SessionLocal
from backend.app.models.user import User
db = SessionLocal()
print('EMAIL | ROLE | STORE_ID')
for u in db.query(User).all():
    print(f'{u.email} | {u.role.role_name} | {u.store_id}')
