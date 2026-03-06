from app.repositories import category_repository

def get_categories():
    return category_repository.get_all_categories()

def create_category(category_name: str, description: str = None):
    """Create a new asset category"""
    # Check if category already exists
    categories = category_repository.get_all_categories()
    if any(cat["category_name"].lower() == category_name.lower() for cat in categories):
        # Return the existing category
        return next(cat for cat in categories if cat["category_name"].lower() == category_name.lower())
    
    # Create new category
    category_repository.create_category(category_name, description)
    # Return the newly created category
    categories = category_repository.get_all_categories()
    return next(cat for cat in categories if cat["category_name"] == category_name)

