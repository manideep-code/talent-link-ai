import random 
from django.core.mail import send_mail
from django.conf import settings

def generate_otp():

    #generateds 6-digits
    
    return str(random.randint(100000, 999999))


def send_otp_email(email,otp):
    subject = 'Your Verification code'
    message = f'Your OTP code is {otp}. It expires in 10 minutes.'
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]

    try:
        send_mail(subject, message, email_from, recipient_list)
    
    except Exception as e:
        print(f"Error sending email: {e}")

