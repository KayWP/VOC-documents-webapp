import pandas as pd
import json
from pathlib import Path

def main():
    try:
        prepare_archive_data()
        print("\n✅ Data preparation complete!")
        print(f"📁 Upload the entire 'data' folder to your web server")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find csv_file'")
        print("   Place your CSV file in the same directory as this script")
    except KeyError as e:
        print(f"❌ Error: Column {e} not found in CSV")
        print("   Update INVENTORY_COLUMN variable to match your CSV")
    except Exception as e:
        print(f"❌ Error: {e}")

def prepare_archive_data(csv_path='GLOBALISE - Digitized Indexes of the Dutch East India Company OBP (1602-1799).csv',
                         inventory_column='INVENTORY NUMBER'):
    print(f"reading {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False)

    #load the csv
    print(f"found {len(df)} rows with {df[inventory_column].nunique()} unique inventories")

    output_dir = Path("data/inventories")
    output_dir.mkdir(parents=True, exist_ok=True)

    inventory_stats = []

    #generate a folder friendly name
    for inventory_num, group in df.groupby(inventory_column):
        safe_filename = str(inventory_num).replace('/', '_').replace('\\', '_')
        filepath = output_dir / f"{safe_filename}.json"

        #convert to JSON (by orienting to records)
        records = group.fillna(0).to_dict(orient='records')


        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False)

        # Collect stats for the index
        inventory_stats.append({
            'inventory_number': inventory_num,
            'item_count': len(group),
            'filename': f"{safe_filename}.json"
        })

        print(f"  ✓ {inventory_num}: {len(group)} items → {filepath}")

    #create index file
    index_path = Path('data/inventory_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(inventory_stats, f, indent=2, ensure_ascii=False)

    
    return inventory_stats

if __name__ == '__main__':
    main()