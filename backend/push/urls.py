from django.urls import path
from .views import SuscribirView, DesuscribirView

urlpatterns = [
    path('suscribir/', SuscribirView.as_view()),
    path('desuscribir/', DesuscribirView.as_view()),
]
