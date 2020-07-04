# Observer for Airtable

Observer is an open-source Airtable block that enables streamlined activity feed across all collaborators on an Airtable base.

# Introduction

Observer is an open-source Airtable block that enables streamlined activity feed across all collaborators on an Airtable base through automatic event tracking. The extension improves team collaboration by providing a single cohesive view of all changes performed across an entire Airtable base in a simple and easy to use interface.

This block is not yet publicly released and is currently in closed beta testing for stability and production readiness.

# Features

* **Automatic Activity Tracking**: All changes to any tables are automatically tracked for new record creation, updates on existing records, and record deletion.
* **Selective Table Tracking**: Collaborators can select which tables to track or untrack in block settings.
* **Multi-user Collaboration**: Events are shared across all collaborators who have the block installed.
* **Filterable Activity Viewer**: Collaborators can customize their own Activity Feed by selectively viewing activities from a particular table or view.
* **Expandable Events**: Events in the Activity Feed are expandable to allow a collaborator to view details of a record.
* **Easy setup**: Just installing the block will automatically start tracking changes, no configuration required. All tables are automatically tracked by default unless turned off in settings.

# Current Limitations
Currently tracking is not available for changes made on expanded record popup window and kanban board drag and drop.

# Block Demo

Our example will use a small shoes reseller who is managing their stock inventory on Airtable for three locations: their main warehouse and two walk-in stores.

**Tracking Activity**
Events for all tables are automatically tracked by default. Changes in a table is recorded and displayed on the block.

**Viewing Event Details**
Events in the Activity View can be expanded to show details of the record. 

**Switching Activity View Table**
You can easily switch to view events from other tables.

**Configuring Tables to Watch Or Unwatch**
Control which tables to watch or unwatch in the block settings. All tables are watched by default including newly created tables. *Note: When unwatching a table, all events recorded for that table will be cleared from the Activity View.*
