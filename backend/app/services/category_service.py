from app.repositories import category_repository

def get_categories():
    return category_repository.get_all_categories()
