#!/usr/bin/env python3
"""
Command-line interface for Secondary Sales Automation Lead Management
"""

import argparse
import sys
import json
from lead_manager import LeadManager, LeadStatus, LeadSource


def format_lead(lead: dict) -> str:
    """Format a lead for display"""
    return f"""
Lead ID: {lead['id']}
Name: {lead['name']}
Email: {lead['email'] or 'N/A'}
Phone: {lead['phone'] or 'N/A'}
Company: {lead['company'] or 'N/A'}
Status: {lead['status']}
Source: {lead['source'] or 'N/A'}
Estimated Value: ${lead['estimated_value']:,.2f}
Notes: {lead['notes'] or 'N/A'}
Created: {lead['created_at']}
Updated: {lead['updated_at']}
"""


def cmd_add(args):
    """Add a new lead"""
    with LeadManager() as lm:
        lead_id = lm.create_lead(
            name=args.name,
            email=args.email,
            phone=args.phone,
            company=args.company,
            status=args.status,
            source=args.source,
            estimated_value=args.value,
            notes=args.notes
        )
        print(f"✓ Lead created successfully with ID: {lead_id}")


def cmd_list(args):
    """List all leads"""
    with LeadManager() as lm:
        leads = lm.get_all_leads(status=args.status)
        if not leads:
            print("No leads found.")
            return

        print(f"\nFound {len(leads)} lead(s):\n")
        for lead in leads:
            print("-" * 60)
            print(format_lead(lead))


def cmd_get(args):
    """Get a specific lead"""
    with LeadManager() as lm:
        lead = lm.get_lead(args.id)
        if not lead:
            print(f"Error: Lead with ID {args.id} not found.")
            sys.exit(1)

        print(format_lead(lead))


def cmd_update(args):
    """Update a lead"""
    with LeadManager() as lm:
        updates = {}
        if args.name:
            updates['name'] = args.name
        if args.email:
            updates['email'] = args.email
        if args.phone:
            updates['phone'] = args.phone
        if args.company:
            updates['company'] = args.company
        if args.status:
            updates['status'] = args.status
        if args.source:
            updates['source'] = args.source
        if args.value is not None:
            updates['estimated_value'] = args.value
        if args.notes:
            updates['notes'] = args.notes

        if not updates:
            print("Error: No updates specified.")
            sys.exit(1)

        success = lm.update_lead(args.id, **updates)
        if success:
            print(f"✓ Lead {args.id} updated successfully.")
        else:
            print(f"Error: Lead with ID {args.id} not found.")
            sys.exit(1)


def cmd_delete(args):
    """Delete a lead"""
    with LeadManager() as lm:
        if not args.force:
            confirm = input(f"Are you sure you want to delete lead {args.id}? (y/N): ")
            if confirm.lower() != 'y':
                print("Cancelled.")
                return

        success = lm.delete_lead(args.id)
        if success:
            print(f"✓ Lead {args.id} deleted successfully.")
        else:
            print(f"Error: Lead with ID {args.id} not found.")
            sys.exit(1)


def cmd_search(args):
    """Search for leads"""
    with LeadManager() as lm:
        leads = lm.search_leads(args.query)
        if not leads:
            print(f"No leads found matching '{args.query}'.")
            return

        print(f"\nFound {len(leads)} lead(s) matching '{args.query}':\n")
        for lead in leads:
            print("-" * 60)
            print(format_lead(lead))


def cmd_stats(args):
    """Show lead statistics"""
    with LeadManager() as lm:
        stats = lm.get_statistics()
        print("\n=== Lead Statistics ===\n")
        print(f"Total Leads: {stats['total_leads']}")
        print(f"Total Estimated Value: ${stats['total_estimated_value']:,.2f}")
        print(f"Conversion Rate: {stats['conversion_rate']}%")
        print("\nLeads by Status:")
        for status, count in stats['by_status'].items():
            print(f"  {status}: {count}")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Secondary Sales Automation - Lead Management CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Add lead command
    add_parser = subparsers.add_parser('add', help='Add a new lead')
    add_parser.add_argument('name', help='Lead name')
    add_parser.add_argument('--email', help='Email address')
    add_parser.add_argument('--phone', help='Phone number')
    add_parser.add_argument('--company', help='Company name')
    add_parser.add_argument('--status', default='new',
                           choices=[s.value for s in LeadStatus],
                           help='Lead status (default: new)')
    add_parser.add_argument('--source',
                           choices=[s.value for s in LeadSource],
                           help='Lead source')
    add_parser.add_argument('--value', type=float, default=0.0,
                           help='Estimated value (default: 0.0)')
    add_parser.add_argument('--notes', help='Additional notes')
    add_parser.set_defaults(func=cmd_add)

    # List leads command
    list_parser = subparsers.add_parser('list', help='List all leads')
    list_parser.add_argument('--status',
                            choices=[s.value for s in LeadStatus],
                            help='Filter by status')
    list_parser.set_defaults(func=cmd_list)

    # Get lead command
    get_parser = subparsers.add_parser('get', help='Get a specific lead')
    get_parser.add_argument('id', type=int, help='Lead ID')
    get_parser.set_defaults(func=cmd_get)

    # Update lead command
    update_parser = subparsers.add_parser('update', help='Update a lead')
    update_parser.add_argument('id', type=int, help='Lead ID')
    update_parser.add_argument('--name', help='Lead name')
    update_parser.add_argument('--email', help='Email address')
    update_parser.add_argument('--phone', help='Phone number')
    update_parser.add_argument('--company', help='Company name')
    update_parser.add_argument('--status',
                              choices=[s.value for s in LeadStatus],
                              help='Lead status')
    update_parser.add_argument('--source',
                              choices=[s.value for s in LeadSource],
                              help='Lead source')
    update_parser.add_argument('--value', type=float, help='Estimated value')
    update_parser.add_argument('--notes', help='Additional notes')
    update_parser.set_defaults(func=cmd_update)

    # Delete lead command
    delete_parser = subparsers.add_parser('delete', help='Delete a lead')
    delete_parser.add_argument('id', type=int, help='Lead ID')
    delete_parser.add_argument('-f', '--force', action='store_true',
                              help='Skip confirmation prompt')
    delete_parser.set_defaults(func=cmd_delete)

    # Search leads command
    search_parser = subparsers.add_parser('search', help='Search for leads')
    search_parser.add_argument('query', help='Search query (name, email, or company)')
    search_parser.set_defaults(func=cmd_search)

    # Statistics command
    stats_parser = subparsers.add_parser('stats', help='Show lead statistics')
    stats_parser.set_defaults(func=cmd_stats)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
