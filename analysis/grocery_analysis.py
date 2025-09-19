#!/usr/bin/env python3
"""
Grocery Item Analysis Script
Analyzes most frequently added grocery items across all users
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from typing import List, Dict, Any
import argparse


class GroceryAnalyzer:
    """Analyzes grocery item data from PostgreSQL database"""

    def __init__(self, connection_string: str = None):
        """Initialize with database connection string"""
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres123@localhost:5432/grocery_db'
        )

    def connect(self):
        """Create database connection"""
        try:
            return psycopg2.connect(
                self.connection_string,
                cursor_factory=RealDictCursor
            )
        except psycopg2.Error as e:
            print(f"Error connecting to database: {e}")
            sys.exit(1)

    def get_top_items(self, limit: int = 5) -> pd.DataFrame:
        """
        Query the most frequently added grocery items across all users

        Args:
            limit: Number of top items to return

        Returns:
            DataFrame with item names and counts
        """
        query = """
        SELECT
            name as item_name,
            COUNT(*) as frequency,
            COUNT(DISTINCT user_id) as unique_users,
            AVG(CAST(quantity AS FLOAT)) as avg_quantity,
            MIN(created_at) as first_added,
            MAX(updated_at) as last_updated
        FROM grocery_items
        GROUP BY name
        ORDER BY frequency DESC
        LIMIT %s
        """

        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            if rows:
                df = pd.DataFrame(rows)
            else:
                df = pd.DataFrame()

        return df

    def get_store_distribution(self) -> pd.DataFrame:
        """Get distribution of items by store"""
        query = """
        SELECT
            store,
            COUNT(*) as item_count,
            COUNT(DISTINCT name) as unique_items,
            COUNT(DISTINCT user_id) as customers
        FROM grocery_items
        WHERE store IS NOT NULL AND store != ''
        GROUP BY store
        ORDER BY item_count DESC
        """

        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            if rows:
                df = pd.DataFrame(rows)
            else:
                df = pd.DataFrame()

        return df

    def get_user_statistics(self) -> pd.DataFrame:
        """Get user statistics"""
        query = """
        SELECT
            u.email,
            COUNT(gi.id) as total_items,
            COUNT(DISTINCT gi.name) as unique_items,
            COUNT(DISTINCT gi.store) as stores_visited,
            MIN(gi.created_at) as first_item_date,
            MAX(gi.created_at) as last_item_date
        FROM users u
        LEFT JOIN grocery_items gi ON u.id = gi.user_id
        GROUP BY u.id, u.email
        ORDER BY total_items DESC
        """

        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            if rows:
                df = pd.DataFrame(rows)
            else:
                df = pd.DataFrame()

        return df

    def create_bar_chart(self, df: pd.DataFrame, output_file: str = None):
        """
        Create an interactive bar chart of top grocery items

        Args:
            df: DataFrame with item data
            output_file: Optional file path to save the chart
        """
        # Create the bar chart
        fig = go.Figure()

        # Add main bar for frequency
        fig.add_trace(go.Bar(
            x=df['item_name'],
            y=df['frequency'],
            name='Total Count',
            marker_color='#3498db',
            text=df['frequency'],
            textposition='outside',
            hovertemplate='<b>%{x}</b><br>' +
                         'Total Count: %{y}<br>' +
                         'Unique Users: %{customdata[0]}<br>' +
                         'Avg Quantity: %{customdata[1]:.1f}<br>' +
                         '<extra></extra>',
            customdata=df[['unique_users', 'avg_quantity']].values
        ))

        # Update layout
        fig.update_layout(
            title={
                'text': 'Top 5 Most Frequently Added Grocery Items',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 24, 'color': '#2c3e50'}
            },
            xaxis={
                'title': 'Grocery Item',
                'tickangle': -45,
                'titlefont': {'size': 16}
            },
            yaxis={
                'title': 'Frequency',
                'titlefont': {'size': 16}
            },
            plot_bgcolor='#f8f9fa',
            paper_bgcolor='white',
            margin={'l': 60, 'r': 60, 't': 80, 'b': 100},
            showlegend=False,
            hovermode='x unified'
        )

        # Add gridlines
        fig.update_yaxes(gridcolor='#e1e8ed', gridwidth=1)

        # Save or show the chart
        if output_file:
            fig.write_html(output_file)
            print(f"Chart saved to {output_file}")

        return fig

    def create_comprehensive_dashboard(self, output_file: str = None):
        """Create a comprehensive dashboard with multiple visualizations"""
        from plotly.subplots import make_subplots

        # Get all data
        top_items = self.get_top_items(10)
        store_dist = self.get_store_distribution()
        user_stats = self.get_user_statistics()

        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=(
                'Top 10 Most Frequent Items',
                'Distribution by Store',
                'Items per User',
                'Average Quantity by Item'
            ),
            specs=[
                [{'type': 'bar'}, {'type': 'pie'}],
                [{'type': 'bar'}, {'type': 'bar'}]
            ]
        )

        # 1. Top items bar chart
        fig.add_trace(
            go.Bar(
                x=top_items['item_name'][:10],
                y=top_items['frequency'][:10],
                marker_color='#3498db',
                text=top_items['frequency'][:10],
                textposition='outside'
            ),
            row=1, col=1
        )

        # 2. Store distribution pie chart
        if not store_dist.empty:
            fig.add_trace(
                go.Pie(
                    labels=store_dist['store'][:5],
                    values=store_dist['item_count'][:5],
                    hole=0.3
                ),
                row=1, col=2
            )

        # 3. Items per user
        if not user_stats.empty:
            fig.add_trace(
                go.Bar(
                    x=user_stats['email'][:5],
                    y=user_stats['total_items'][:5],
                    marker_color='#2ecc71',
                    text=user_stats['total_items'][:5],
                    textposition='outside'
                ),
                row=2, col=1
            )

        # 4. Average quantity by item
        fig.add_trace(
            go.Bar(
                x=top_items['item_name'][:5],
                y=top_items['avg_quantity'][:5],
                marker_color='#e74c3c',
                text=[f"{q:.1f}" for q in top_items['avg_quantity'][:5]],
                textposition='outside'
            ),
            row=2, col=2
        )

        # Update layout
        fig.update_layout(
            height=800,
            showlegend=False,
            title={
                'text': 'Grocery Shopping Analytics Dashboard',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 26, 'color': '#2c3e50'}
            },
            plot_bgcolor='#f8f9fa',
            paper_bgcolor='white'
        )

        # Update axes
        fig.update_xaxes(tickangle=-45)

        if output_file:
            fig.write_html(output_file)
            print(f"Dashboard saved to {output_file}")

        return fig

    def print_analysis_summary(self):
        """Print a summary of the analysis to console"""
        print("\n" + "="*60)
        print("GROCERY ITEM ANALYSIS REPORT")
        print("="*60)
        print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-"*60)

        # Top items
        print("\n📊 TOP 5 MOST FREQUENT ITEMS:")
        print("-"*60)
        top_items = self.get_top_items(5)

        for idx, row in top_items.iterrows():
            freq = int(row['frequency'])
            users = int(row['unique_users'])
            avg_qty = float(row['avg_quantity']) if row['avg_quantity'] else 0
            print(f"{idx+1}. {row['item_name']:<20} - Count: {freq:>3} | "
                  f"Users: {users:>2} | Avg Qty: {avg_qty:.1f}")

        # Store distribution
        print("\n🏪 STORE DISTRIBUTION:")
        print("-"*60)
        stores = self.get_store_distribution()
        if not stores.empty:
            for idx, row in stores.head(3).iterrows():
                item_count = int(row['item_count'])
                unique_items = int(row['unique_items'])
                customers = int(row['customers'])
                print(f"  {row['store']:<20} - Items: {item_count:>3} | "
                      f"Unique: {unique_items:>3} | Customers: {customers:>2}")
        else:
            print("  No store data available")

        # User statistics
        print("\n👥 TOP SHOPPERS:")
        print("-"*60)
        users = self.get_user_statistics()

        if not users.empty:
            for idx, row in users.head(3).iterrows():
                total_items = int(row['total_items']) if row['total_items'] else 0
                unique_items = int(row['unique_items']) if row['unique_items'] else 0
                print(f"  {row['email']:<30} - Items: {total_items:>3} | "
                      f"Unique: {unique_items:>3}")
        else:
            print("  No user data available")

        print("\n" + "="*60 + "\n")


def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Analyze grocery shopping data')
    parser.add_argument(
        '--output',
        '-o',
        default='grocery_analysis.html',
        help='Output file for the chart (HTML format)'
    )
    parser.add_argument(
        '--dashboard',
        '-d',
        action='store_true',
        help='Create comprehensive dashboard instead of single chart'
    )
    parser.add_argument(
        '--db-url',
        help='Database connection URL',
        default=None
    )

    args = parser.parse_args()

    # Create analyzer instance
    analyzer = GroceryAnalyzer(args.db_url)

    try:
        # Print summary
        analyzer.print_analysis_summary()

        # Create visualization
        if args.dashboard:
            fig = analyzer.create_comprehensive_dashboard(args.output)
            print(f"\n✅ Dashboard created successfully!")
        else:
            # Get top 5 items
            top_items = analyzer.get_top_items(5)

            if top_items.empty:
                print("No data found in the database.")
                return

            # Create and save chart
            fig = analyzer.create_bar_chart(top_items, args.output)
            print(f"\n✅ Analysis complete! Chart saved to {args.output}")

        # Display the chart
        fig.show()

    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()