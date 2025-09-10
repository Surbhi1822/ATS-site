from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.forms import forms
from .models import User


class CustomUserCreationForm(UserCreationForm):
    """
    Custom user creation form that handles the custom User model
    """
    class Meta:
        model = User
        fields = ('email', 'username')


class CustomUserChangeForm(UserChangeForm):
    """
    Custom user change form that handles the custom User model
    """
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'must_change_password')


class CustomUserAdmin(UserAdmin):
    """
    Custom UserAdmin that properly handles password fields and includes custom fields
    """
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    
    # Fields to display in the user list view
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'is_active', 'must_change_password')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'must_change_password', 'date_joined')
    
    # Fields for editing existing users
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Password Policy', {'fields': ('must_change_password',)}),
    )
    
    # Fields for adding new users
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'must_change_password'),
        }),
    )
    
    # Search functionality
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    
    # Make email the primary identifier
    readonly_fields = ('date_joined', 'last_login')


# Register the custom User model with the custom admin
admin.site.register(User, CustomUserAdmin)