from rest_framework import serializers
from .models import FreelancerProfile, ClientProfile

class ClientProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    documents = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = ClientProfile
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'company_name',
            'company_description',
            'location',
            'projects',
            'skills',
            'works',
            'profile_image',
            'documents',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Handle the case where 'user' might be passed in validated_data (User instance) 
        # overwriting the dict of user fields we expected.
        
        request = self.context.get('request')
        user = request.user if request else None
        
        # If user is not created yet (shouldn't happen for authenticated profile creation), handle gracefully
        if not user:
             # Fallback: check if passed in validated_data
             if 'user' in validated_data and hasattr(validated_data['user'], 'pk'):
                 user = validated_data['user']
             else:
                 raise serializers.ValidationError("User context required.")

        # Extract name fields from initial data directly to avoid collision issues
        first_name = self.initial_data.get('first_name')
        last_name = self.initial_data.get('last_name')
        
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if first_name is not None or last_name is not None:
            user.save()
        
        # Clean validated_data
        if 'user' in validated_data:
            del validated_data['user']
            
        return ClientProfile.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')
        
        user = instance.user
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if first_name is not None or last_name is not None:
            user.save()
            
        return super().update(instance, validated_data)

class FreelancerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    profile_image = serializers.ImageField(required=False, allow_null=True)
    documents = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = FreelancerProfile
        fields = [
            'id', 
            'email',
            'first_name',
            'last_name',
            'profile_image',
            'documents',
            'skills', 
            'portfolio', 
            'works', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Extract user data if present (for first_name/last_name updates during creation)
        user_data = validated_data.pop('user', {})
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')

        # The 'user' field is read-only in serializer, so it won't be in validated_data naturally
        # unless passed via save(user=request.user) or if source='user.name' created a 'user' dict.
        
        # When creating, we expect the view to pass 'user' in save() or we get it from context?
        # If view calls serializer.save(user=request.user), 'user' key is added to validated_data.
        
        # However, due to collision with 'user' dict from source='user.first_name', 
        # let's be careful.
        
        # If 'user' in validated_data is a User model instance, we use it.
        # If it is a dict, we extract fields and look for the instance elsewhere?
        
        # Actually, standard DRF behavior:
        # If I call save(user=request.user), that value OVERRIDES whatever was structured from input.
        # So 'user' in validated_data becomes the User instance.
        # And the dict with 'first_name' is LOST.
        
        # THIS IS THE PROBLEM.
        
        # Solution:
        # In the VIEW, we should not pass user via save() if we want to rely on the serializer to extract names?
        # OR, we extract names in `to_internal_value`?
        
        # Simplest fix:
        # In `update`, we already have `instance.user`.
        # In `create`, we need the user.
        
        # Let's assume the view attaches `user` to `validated_data` correctly if we handle it right.
        
        # Actually, let's rely on `self.context['request'].user`.
        request = self.context.get('request')
        user = request.user if request else None
        
        if user:
            # Update user names if provided
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
            if first_name is not None or last_name is not None:
                user.save()
            
            # Create profile
            # Ensure we don't pass 'user' dict to create
            if 'user' in validated_data and isinstance(validated_data['user'], dict):
                del validated_data['user']
                
            return FreelancerProfile.objects.create(user=user, **validated_data)
            
        raise serializers.ValidationError("User not found in context")

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        
        # Update User fields if present
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')
        
        user = instance.user
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
            
        if first_name is not None or last_name is not None:
            user.save()
            
        return super().update(instance, validated_data)