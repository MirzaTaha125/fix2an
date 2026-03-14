# EmailJS Setup

EmailJS uses a template with 4 variables: `to_email`, `subject`, `heading`, `body`.

## 1. Create Account
- Go to [emailjs.com](https://www.emailjs.com) and sign up
- Add an email service (Gmail, Outlook, etc.) and verify

## 2. Create Template
In EmailJS dashboard: Email Templates → Create New Template

**Template content (HTML):**
```html
Subject: {{subject}}

<h1 style="color: #1C3F94;">{{heading}}</h1>
<div>
  {{body}}
</div>
```

Template variables: `to_email`, `subject`, `heading`, `body`

## 3. Enable Server-Side API
- Account → Security → "Allow requests from non-browser clients"
- Add a **Private Key** (Access Token) for server-side use

## 4. Admin Panel
Admin → Settings → Email → Provider: **EmailJS**
- User ID (Public Key)
- Service ID
- Template ID
- Private Key (Access Token)
