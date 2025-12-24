#!/usr/bin/env python3
"""
Lead Management System for Secondary Sales Automation
Provides CRUD operations for managing sales leads with SQLite persistence.
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum


class LeadStatus(Enum):
    """Lead status enumeration"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class LeadSource(Enum):
    """Lead source enumeration"""
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_CALL = "cold_call"
    EMAIL = "email"
    SOCIAL_MEDIA = "social_media"
    EVENT = "event"
    OTHER = "other"


class LeadManager:
    """Manages sales leads with SQLite database persistence"""

    def __init__(self, db_path: str = "leads.db"):
        """Initialize the lead manager with database connection"""
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._create_table()

    def _create_table(self):
        """Create the leads table if it doesn't exist"""
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                company TEXT,
                status TEXT NOT NULL DEFAULT 'new',
                source TEXT,
                estimated_value REAL DEFAULT 0.0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def create_lead(
        self,
        name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        company: Optional[str] = None,
        status: str = "new",
        source: Optional[str] = None,
        estimated_value: float = 0.0,
        notes: Optional[str] = None
    ) -> int:
        """Create a new lead and return its ID"""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO leads (name, email, phone, company, status, source, estimated_value, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, email, phone, company, status, source, estimated_value, notes))
        self.conn.commit()
        return cursor.lastrowid

    def get_lead(self, lead_id: int) -> Optional[Dict]:
        """Get a lead by ID"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_all_leads(self, status: Optional[str] = None) -> List[Dict]:
        """Get all leads, optionally filtered by status"""
        cursor = self.conn.cursor()
        if status:
            cursor.execute("SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC", (status,))
        else:
            cursor.execute("SELECT * FROM leads ORDER BY created_at DESC")
        return [dict(row) for row in cursor.fetchall()]

    def update_lead(self, lead_id: int, **kwargs) -> bool:
        """Update lead fields"""
        valid_fields = ['name', 'email', 'phone', 'company', 'status', 'source', 'estimated_value', 'notes']
        updates = {k: v for k, v in kwargs.items() if k in valid_fields}

        if not updates:
            return False

        # Add updated_at timestamp
        updates['updated_at'] = datetime.now().isoformat()

        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [lead_id]

        cursor = self.conn.cursor()
        cursor.execute(f"UPDATE leads SET {set_clause} WHERE id = ?", values)
        self.conn.commit()
        return cursor.rowcount > 0

    def delete_lead(self, lead_id: int) -> bool:
        """Delete a lead by ID"""
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        self.conn.commit()
        return cursor.rowcount > 0

    def search_leads(self, query: str) -> List[Dict]:
        """Search leads by name, email, or company"""
        cursor = self.conn.cursor()
        search_pattern = f"%{query}%"
        cursor.execute("""
            SELECT * FROM leads
            WHERE name LIKE ? OR email LIKE ? OR company LIKE ?
            ORDER BY created_at DESC
        """, (search_pattern, search_pattern, search_pattern))
        return [dict(row) for row in cursor.fetchall()]

    def get_statistics(self) -> Dict:
        """Get lead statistics"""
        cursor = self.conn.cursor()

        # Total leads
        cursor.execute("SELECT COUNT(*) as total FROM leads")
        total = cursor.fetchone()['total']

        # Leads by status
        cursor.execute("SELECT status, COUNT(*) as count FROM leads GROUP BY status")
        by_status = {row['status']: row['count'] for row in cursor.fetchall()}

        # Total estimated value
        cursor.execute("SELECT SUM(estimated_value) as total_value FROM leads")
        total_value = cursor.fetchone()['total_value'] or 0.0

        # Conversion rate (won / total)
        won_count = by_status.get('won', 0)
        conversion_rate = (won_count / total * 100) if total > 0 else 0.0

        return {
            'total_leads': total,
            'by_status': by_status,
            'total_estimated_value': total_value,
            'conversion_rate': round(conversion_rate, 2)
        }

    def close(self):
        """Close the database connection"""
        self.conn.close()

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


if __name__ == "__main__":
    # Example usage
    with LeadManager() as lm:
        # Create sample leads
        lead1_id = lm.create_lead(
            name="John Doe",
            email="john.doe@example.com",
            phone="+1-555-0101",
            company="Acme Corp",
            status="new",
            source="website",
            estimated_value=50000.0,
            notes="Interested in enterprise plan"
        )

        lead2_id = lm.create_lead(
            name="Jane Smith",
            email="jane.smith@techco.com",
            phone="+1-555-0102",
            company="TechCo",
            status="contacted",
            source="referral",
            estimated_value=75000.0,
            notes="Referred by existing customer"
        )

        print("Created sample leads:")
        print(f"Lead 1 ID: {lead1_id}")
        print(f"Lead 2 ID: {lead2_id}")

        # Get all leads
        all_leads = lm.get_all_leads()
        print(f"\nTotal leads: {len(all_leads)}")

        # Get statistics
        stats = lm.get_statistics()
        print(f"\nStatistics: {json.dumps(stats, indent=2)}")
