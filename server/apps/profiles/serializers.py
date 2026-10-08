from rest_framework import serializers
from django.conf import settings
from .models import FreelancerProfile, ClientProfile


class RelativeMediaImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None

        # Do not return a URL for a file that no longer exists.
        # This prevents broken /media/ URLs and lets the frontend
        # use its avatar fallback instead.
        try:
            if not value.storage.exists(value.name):
                return None
        except Exception:
            return None

        return f"{settings.MEDIA_URL}{value.name}"


class ClientProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    documents = serializers.FileField(required=False, allow_null=True)
    profile_image = RelativeMediaImageField(required=False, allow_null=True)

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
        read_only_fields = [
            'id',
            'email',
            'created_at',
            'updated_at'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        if not user:
            if 'user' in validated_data and hasattr(validated_data['user'], 'pk'):
                user = validated_data['user']
            else:
                raise serializers.ValidationError("User context required.")

        first_name = self.initial_data.get('first_name')
        last_name = self.initial_data.get('last_name')

        if first_name is not None:
            user.first_name = first_name

        if last_name is not None:
            user.last_name = last_name

        if first_name is not None or last_name is not None:
            user.save()

        if 'user' in validated_data:
            del validated_data['user']

        return ClientProfile.objects.create(
            user=user,
            **validated_data
        )

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
    profile_image = RelativeMediaImageField(required=False, allow_null=True)
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
        read_only_fields = [
            'id',
            'email',
            'created_at',
            'updated_at'
        ]

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')

        request = self.context.get('request')
        user = request.user if request else None

        if user:
            if first_name is not None:
                user.first_name = first_name

            if last_name is not None:
                user.last_name = last_name

            if first_name is not None or last_name is not None:
                user.save()

            if 'user' in validated_data and isinstance(
                validated_data['user'],
                dict
            ):
                del validated_data['user']

            return FreelancerProfile.objects.create(
                user=user,
                **validated_data
            )

        raise serializers.ValidationError("User not found in context")

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