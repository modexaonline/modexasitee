-- Modexa v18: temporary page hiding. No schema change needed: the hidden list is stored as a normal row in the existing
-- site_content table (key 'visibility', data {"hidden": ["/apps", ...]}) by Admin → Website editor → Hide / Unhide.
select 1;
