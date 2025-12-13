# IMDb Data Files

This folder should contain the IMDb public datasets required for processing.

## Required Files

Download the following files from [IMDb Datasets](https://datasets.imdbws.com/):

- `name.basics.tsv.gz` - Contains information about people (actors, directors, etc.)
- `title.basics.tsv.gz` - Contains basic information about titles (movies, TV shows, etc.)
- `title.principals.tsv.gz` - Contains principal cast/crew for titles
- `title.ratings.tsv.gz` - Contains ratings information for titles

## Dataset Information

- **Format**: Tab-separated values (TSV) files compressed with gzip
- **Size**: Approximately 3-4 GB total (compressed)
- **Update Frequency**: Daily

## Usage

After downloading the files to this folder, run:

```bash
npm run process-imdb
```

This will process the datasets and generate `static/data/imdb-data.json.gz` for use in the application.

## Processing Criteria

The processing script applies the following filters:

- **Movies only** (no TV series, shorts, etc.)
- **Minimum rating**: 4.5/10
- **Minimum votes**: 1,000
- **Minimum runtime**: 40 minutes
- **Non-adult content only**
- **Actors must appear in at least 3 qualifying movies**
- **Top 30 billed actors per movie**

## License

IMDb datasets are available for personal and non-commercial use. See:
https://www.imdb.com/interfaces/

## More Information

See `design/imdb_integration_design.md` for detailed design documentation.
