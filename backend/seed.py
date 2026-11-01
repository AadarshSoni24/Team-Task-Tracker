#!/usr/bin/env python
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import mongoengine as me
from django.contrib.auth.hashers import make_password

# Set up project environment
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from core.models import User, Team, Task, Comment, Activity, Invitation, RevokedToken
from core.services import log_activity, format_iso


def seed():
    print("Seeding database...")
    now = datetime.now(timezone.utc).replace(microsecond=0)

    # 1. Create or retrieve Admin User
    admin = User.objects(email='admin@example.com').first()
    if not admin:
        admin = User(
            name='Admin User',
            email='admin@example.com',
            password=make_password('Admin@1234'),
            role='admin',
            created_at=now - timedelta(days=5)
        )
        admin.save()
        print(f"Created Admin: {admin.email}")
    else:
        print(f"Admin already exists: {admin.email}")

    # 2. Create or retrieve Members
    riya = User.objects(email='riya@example.com').first()
    if not riya:
        riya = User(
            name='Riya Sharma',
            email='riya@example.com',
            password=make_password('Member@1234'),
            role='member',
            created_at=now - timedelta(days=4)
        )
        riya.save()
        print(f"Created Member: {riya.email}")
    else:
        print(f"Member already exists: {riya.email}")

    sam = User.objects(email='sam@example.com').first()
    if not sam:
        sam = User(
            name='Sam Miller',
            email='sam@example.com',
            password=make_password('Member@1234'),
            role='member',
            created_at=now - timedelta(days=4)
        )
        sam.save()
        print(f"Created Member: {sam.email}")
    else:
        print(f"Member already exists: {sam.email}")

    # 3. Create or update Team
    team = Team.objects(name='Core Product Team').first()
    if not team:
        team = Team(
            name='Core Product Team',
            description='Cross-functional product and engineering squad building the Task Tracker.',
            created_by=admin,
            members=[admin, riya, sam],
            created_at=now - timedelta(days=3)
        )
        team.save()
        print(f"Created Team: {team.name}")

        # Seed member_added activity
        log_activity(
            team=team,
            actor=admin,
            action=Activity.ACTION_MEMBER_ADDED,
            message=f"{admin.name} added {riya.name} to the team"
        )
        log_activity(
            team=team,
            actor=admin,
            action=Activity.ACTION_MEMBER_ADDED,
            message=f"{admin.name} added {sam.name} to the team"
        )
    else:
        print(f"Team already exists: {team.name}")
        # Ensure all three are members
        member_ids = [str(m.id) for m in team.members]
        for u in [admin, riya, sam]:
            if str(u.id) not in member_ids:
                team.members.append(u)
        team.save()

    # 4. Create 5 Tasks across statuses
    tasks_spec = [
        {
            'title': 'Design API endpoints',
            'description': 'Finalize REST contract, status codes, and error envelopes.',
            'assigned_to': riya,
            'status': Task.STATUS_DONE,
            'created_by': admin,
        },
        {
            'title': 'Implement JWT Authentication',
            'description': 'PyJWT access (15 min) and refresh (7 days, rotated) token lifecycle.',
            'assigned_to': sam,
            'status': Task.STATUS_DONE,
            'created_by': riya,
        },
        {
            'title': 'Build Team and Role-Based Permissions',
            'description': 'Admins invite and create teams; team members access scoped resources.',
            'assigned_to': riya,
            'status': Task.STATUS_IN_PROGRESS,
            'created_by': admin,
        },
        {
            'title': 'Setup Task Activity Timeline Feed',
            'description': 'Chronological timeline with limit and since polling support.',
            'assigned_to': sam,
            'status': Task.STATUS_IN_PROGRESS,
            'created_by': riya,
        },
        {
            'title': 'Draft Comprehensive API Documentation',
            'description': 'Write docs/API.md with realistic request/response schemas for Figma Make.',
            'assigned_to': admin,
            'status': Task.STATUS_PENDING,
            'created_by': admin,
        },
    ]

    for spec in tasks_spec:
        task = Task.objects(team=team, title=spec['title']).first()
        if not task:
            task = Task(
                title=spec['title'],
                description=spec['description'],
                assigned_to=spec['assigned_to'],
                status=spec['status'],
                team=team,
                created_by=spec['created_by']
            )
            task.save()
            print(f"Created Task: '{task.title}' [{task.status}]")

            # Log task created
            log_activity(
                team=team,
                actor=task.created_by,
                task=task,
                action=Activity.ACTION_TASK_CREATED,
                message=f'{task.created_by.name} created task "{task.title}"'
            )

            # If done or in progress, also log status changed
            if task.status in (Task.STATUS_IN_PROGRESS, Task.STATUS_DONE):
                label = 'In Progress' if task.status == Task.STATUS_IN_PROGRESS else 'Done'
                log_activity(
                    team=team,
                    actor=task.assigned_to or task.created_by,
                    task=task,
                    action=Activity.ACTION_STATUS_CHANGED,
                    message=f'{(task.assigned_to or task.created_by).name} changed status of "{task.title}" to {label}'
                )
        else:
            print(f"Task already exists: '{task.title}'")

    # 5. Create Comments
    t1 = Task.objects(team=team, title='Design API endpoints').first()
    if t1 and not Comment.objects(task=t1).first():
        c1 = Comment(
            task=t1,
            user=riya,
            text='API contract and error schemas finalized.'
        ).save()
        log_activity(
            team=team,
            actor=riya,
            task=t1,
            action=Activity.ACTION_COMMENTED,
            message=f'{riya.name} commented on "{t1.title}"'
        )
        print("Created Comment on Task 1")

    t2 = Task.objects(team=team, title='Implement JWT Authentication').first()
    if t2 and not Comment.objects(task=t2).first():
        c2 = Comment(
            task=t2,
            user=sam,
            text='JWT access and refresh rotation tests passing with 100% assertions.'
        ).save()
        log_activity(
            team=team,
            actor=sam,
            task=t2,
            action=Activity.ACTION_COMMENTED,
            message=f'{sam.name} commented on "{t2.title}"'
        )
        print("Created Comment on Task 2")

    t3 = Task.objects(team=team, title='Build Team and Role-Based Permissions').first()
    if t3 and not Comment.objects(task=t3).first():
        c3 = Comment(
            task=t3,
            user=admin,
            text='Please ensure non-members strictly receive HTTP 403 on task and activity reads.'
        ).save()
        log_activity(
            team=team,
            actor=admin,
            task=t3,
            action=Activity.ACTION_COMMENTED,
            message=f'{admin.name} commented on "{t3.title}"'
        )
        print("Created Comment on Task 3")

    print("\nDatabase seeded successfully!")
    print("Seed credentials:")
    print("  Admin:  admin@example.com / Admin@1234")
    print("  Member: riya@example.com  / Member@1234")
    print("  Member: sam@example.com   / Member@1234")


if __name__ == '__main__':
    seed()

