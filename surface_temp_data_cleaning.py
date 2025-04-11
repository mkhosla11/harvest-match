# Rename columns
df.columns = ['Country', 'CountryCode', 'Year', 'Date', 'CountryAvgTemp', 'GlobalAvgTemp']

# Convert 'Date' to datetime format
df['Date'] = pd.to_datetime(df['Date'])

# Drop 'Year' since it's redundant with 'Date'
df.drop(columns=['Year'], inplace=True)

# Checking for duplicates
duplicates = df.duplicated().sum()

# Dropping duplicates if any
df = df.drop_duplicates()

# Checking for missing values
missing_values = df.isnull().sum()

# Summary of the cleanup
summary = {
    "duplicates_removed": duplicates,
    "missing_values": missing_values.to_dict(),
    "data_shape_after_cleaning": df.shape
}

summary
