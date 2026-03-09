from app.repositories import category_repository

def get_categories():
    return category_repository.get_all_categories()

def create_category(category_name: str, description: str = None):
    """Create a new asset category"""
    # Check if category already exists
    categories = category_repository.get_all_categories()
    for cat in categories:
        if cat["category_name"].lower() == category_name.lower():
            return cat
    
    # Create new category
    new_id = category_repository.create_category(category_name, description)
    
    # Return the newly created category
    categories = category_repository.get_all_categories()
    for cat in categories:
        if cat["category_id"] == new_id:
            return cat
    
    return {"category_id": new_id, "category_name": category_name, "description": description}


