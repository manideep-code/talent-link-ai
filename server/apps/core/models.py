from django.db import models


class SiteSetting(models.Model):
    key = models.CharField(max_length=128, unique=True)
    value = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site setting"
        verbose_name_plural = "Site settings"

    def __str__(self) -> str:
        return f"{self.key}"
