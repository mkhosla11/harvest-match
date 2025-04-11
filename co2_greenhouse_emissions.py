# Checking missing value ratio for each column
missing_ratios_initial = df_co2.isnull().mean()

#Keeping columns with <= 85% missing data
columns_to_keep_initial = missing_ratios_initial[missing_ratios_initial <= 0.85].index
df_co2_cleaned_final = df_co2[columns_to_keep_initial].copy()

#Dropping duplicates
df_co2_cleaned_final = df_co2_cleaned_final.drop_duplicates()

df_co2_cleaned_final = df_co2_cleaned_final.sort_values(by=['country', 'year'])
df_co2_cleaned_final = df_co2_cleaned_final.groupby('country').ffill()
