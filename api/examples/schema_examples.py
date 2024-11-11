PHILOSOPHERS_SCHEMA_EXAMPLE = {
    "summary": "Philosophers Schema Example",
    "description": "A sample schema for storing philosopher information",
    "value": {
        "name": "philosophers_schema",
        "fields": [
            {
                "name": "name",
                "field_type": "string",
                "description": "Name of the philosopher",
                "required": True
            },
            {
                "name": "description",
                "field_type": "string",
                "description": "Description of the philosopher",
                "required": True
            },
            {
                "name": "area_of_expertise",
                "field_type": "string",
                "description": "Specific area of expertise in philosophy",
                "required": True
            }
        ]
    }
}

EVENTS_SCHEMA_EXAMPLE = {
    "summary": "Events Schema Example",
    "description": "A sample schema for storing event information",
    "value": {
        "name": "events_schema",
        "fields": [
            {
                "name": "event_name",
                "field_type": "string",
                "description": "Name of the event",
                "required": True
            },
            {
                "name": "event_date",
                "field_type": "string",
                "description": "Date of the event",
                "required": False
            },
            {
                "name": "description",
                "field_type": "string",
                "description": "Description of the event",
                "required": True
            },
            {
                "name": "event_tags",
                "field_type": "string",
                "description": "Tags that can be assigned to this event. For example music, sports, festival etc.",
                "required": True
            }
        ]
    }
}

SCHEMA_EXAMPLES = {
    "philosophers_schema": PHILOSOPHERS_SCHEMA_EXAMPLE,
    "events_schema": EVENTS_SCHEMA_EXAMPLE
} 