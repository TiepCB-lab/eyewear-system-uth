# Backend Scaffold

Backend duoc dinh huong la Laravel API-first voi 4 lop chinh:

- `Http`: controller, request, response resource
- `Application`: use case, service
- `Domain`: business rule, repository contract, enum
- `Infrastructure`: repository implementation, external integration

## Thu muc chinh

- `app/Application`: orchestration cho tung module
- `app/Domain`: quy tac nghiep vu va contract
- `app/Http`: presentation layer
- `app/Infrastructure`: repository va service tich hop
- `app/Models`: Eloquent model
- `database`: migration, factory, seeder
- `routes`: dinh nghia route API va web
- `tests`: feature va unit test

## Module backend de xuat

- `Auth`
- `Identity`
- `Catalog`
- `Checkout`
- `Sales`
- `Operations`
- `Support`
- `Reports`
- `Administration`

## Note

Thu muc nay moi la khung cau truc, chua co source Laravel hoan chinh.
