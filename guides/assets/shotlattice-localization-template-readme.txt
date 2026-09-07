ShotLattice localisation CSV template

This UTF-8 CSV contains default copy only. It has the five-column format:
code,label,headline,subtitle,image_id

The first four columns are required. Leave image_id blank to set the default
headline and subtitle for that language. Replace the example copy before import.

Do not invent image_id values. To add a screenshot-specific override, import the
actual screenshots into the current ShotLattice project, obtain the existing image
ID from that project, and add one override row for that image ID and language.
An override needs a default row for the same language. Each image ID/language pair
may appear only once.

ShotLattice supports one to five languages in the full version. The public demo is
deliberately limited to one image, one language, and one iPhone format.
