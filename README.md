## Development

### Setup EmailJS

1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create a new email service
3. Create a new email template with these variables:
   - `{{from_name}}` - sender's name
   - `{{from_email}}` - sender's email
   - `{{message}}` - message content
   - `{{to_name}}` - your name (Austin)
4. Get your Service ID, Template ID, and Public Key from the dashboard
5. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### Run the project

```bash
bun i
bun run dev
```

```
open http://localhost:3000/
```

## Deploy

```
vc deploy
```
