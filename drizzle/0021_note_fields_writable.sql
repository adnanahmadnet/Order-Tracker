-- A "Note" field used to be a line of text with nothing to type in; it is now a box to write in (a long text field).
-- The field keeps its key and its text becomes the box's name. Item forms and the copies on customers are changed.
UPDATE `templates` SET `fields` = REPLACE(`fields`, '"type":"note"', '"type":"longtext"') WHERE `fields` LIKE '%"type":"note"%';--> statement-breakpoint
UPDATE `order_items` SET `snapshot` = REPLACE(`snapshot`, '"type":"note"', '"type":"longtext"') WHERE `snapshot` LIKE '%"type":"note"%';
