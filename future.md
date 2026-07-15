# Future Improvements

## Invoice Search — Date Format
- Currently, invoice date search uses ISO format (`YYYY-MM-DD`) via `strftime` in SQLite
- The display format is controlled by `VITE_DATE_FORMAT` env variable (default `YYYY-MM-DD`)
- If `VITE_DATE_FORMAT` differs from ISO (e.g., `DD/MM/YYYY`), search should format the date server-side to match the user's display format
- Consider: pass the date format as a query parameter, or store a formatted date string alongside the timestamp
