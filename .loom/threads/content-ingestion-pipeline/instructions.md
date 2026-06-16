# content-ingestion-pipeline

Rebuild and maintain the Google Drive ingestion pipeline for Exquisite Stories.

The current Drive source is set via the `DRIVE_ROOT` env var (kept out of source
control — see `docs/content-pipeline.md`):

`export DRIVE_ROOT='gdrive,root_folder_id=<your-folder-id>:'`

The current workflow is `INBOX -> COMPLETE / DROPPED`, with all three folders
mirroring the same six leaf folders:

- `IMAGES_TOP`
- `IMAGES_MIDDLE`
- `IMAGES_BOTTOM`
- `AUDIO_BEGINNING`
- `AUDIO_MIDDLE`
- `AUDIO_END`

Tie child stitches individually as pipeline pieces become reliable.
