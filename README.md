# Secondary Sales Automation

A Python-based sales automation system with lead management capabilities.

## Features

- **Lead Management**: Complete CRUD operations for managing sales leads
- **SQLite Database**: Persistent storage for all lead data
- **Lead Tracking**: Track lead status through the sales pipeline
- **Search & Filter**: Search leads by name, email, or company
- **Statistics**: Get insights into your sales pipeline
- **CLI Interface**: Easy-to-use command-line interface

## Lead Status Pipeline

- `new` - Newly acquired lead
- `contacted` - Initial contact made
- `qualified` - Lead has been qualified
- `proposal` - Proposal sent
- `negotiation` - In negotiation phase
- `won` - Deal closed successfully
- `lost` - Deal lost

## Lead Sources

- `website` - From company website
- `referral` - Customer referral
- `cold_call` - Cold calling
- `email` - Email campaign
- `social_media` - Social media
- `event` - Events/conferences
- `other` - Other sources

## Installation

No external dependencies required! Uses Python's built-in SQLite3.

```bash
# Make the CLI executable
chmod +x cli.py

# Or run with python
python3 cli.py --help
```

## Usage

### Add a New Lead

```bash
python3 cli.py add "John Doe" \
  --email john@example.com \
  --phone "+1-555-0101" \
  --company "Acme Corp" \
  --status new \
  --source website \
  --value 50000 \
  --notes "Interested in enterprise plan"
```

### List All Leads

```bash
# List all leads
python3 cli.py list

# Filter by status
python3 cli.py list --status qualified
```

### Get a Specific Lead

```bash
python3 cli.py get 1
```

### Update a Lead

```bash
python3 cli.py update 1 --status contacted --notes "Called on 2024-01-15"
```

### Delete a Lead

```bash
# With confirmation
python3 cli.py delete 1

# Force delete without confirmation
python3 cli.py delete 1 --force
```

### Search Leads

```bash
python3 cli.py search "Acme"
```

### View Statistics

```bash
python3 cli.py stats
```

## Programmatic Usage

```python
from lead_manager import LeadManager

# Using context manager
with LeadManager() as lm:
    # Create a lead
    lead_id = lm.create_lead(
        name="Jane Smith",
        email="jane@example.com",
        status="new",
        estimated_value=75000.0
    )

    # Get lead
    lead = lm.get_lead(lead_id)

    # Update lead
    lm.update_lead(lead_id, status="contacted")

    # Search leads
    results = lm.search_leads("Jane")

    # Get statistics
    stats = lm.get_statistics()
```

## Database

The system uses SQLite and stores data in `leads.db`. The database is created automatically on first run.

## Project Structure

```
Secondary/
├── lead_manager.py    # Core lead management module
├── cli.py            # Command-line interface
├── leads.db          # SQLite database (created on first run)
└── README.md         # This file
```

## Future Enhancements

- Email integration for automated follow-ups
- Task/reminder system for leads
- Export to CSV/Excel
- Web dashboard
- Integration with CRM systems
- Analytics and reporting
- Multi-user support with authentication
