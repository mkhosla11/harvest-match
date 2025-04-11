df_sea_levels.columns = ['date', 'gmsl_mm', 'gmsl_uncertainty_mm']

df_sea_levels['date'] = pd.to_datetime(df_sea_levels['date'])

df_sea_levels = df_sea_levels.drop_duplicates()

missing_sea_level = df_sea_levels.isnull().sum()

df_sea_levels = df_sea_levels.sort_values(by='date')

# Final shape and missing values
{
    "final_shape": df_sea_levels.shape,
    "missing_values": missing_sea_level.to_dict()
}
