import json
import random

# Actual S&P 500 companies organized by GICS sector
# This is a representative subset covering all 11 sectors

information_technology = [
    'Apple Inc.', 'Microsoft Corporation', 'NVIDIA Corporation', 'Broadcom Inc.', 'Adobe Inc.',
    'Salesforce Inc.', 'Advanced Micro Devices Inc.', 'Cisco Systems Inc.', 'Oracle Corporation', 'Accenture plc',
    'Intel Corporation', 'Intuit Inc.', 'ServiceNow Inc.', 'Qualcomm Inc.', 'Applied Materials Inc.',
    'Automatic Data Processing Inc.', 'Texas Instruments Inc.', 'Lam Research Corporation', 'Palo Alto Networks Inc.', 'Synopsys Inc.',
    'Cadence Design Systems Inc.', 'KLA Corporation', 'Microchip Technology Inc.', 'Micron Technology Inc.', 'ANSYS Inc.',
    'Fortinet Inc.', 'Arista Networks Inc.', 'Roper Technologies Inc.', 'Autodesk Inc.', 'Amphenol Corporation',
    'ON Semiconductor Corporation', 'Marvell Technology Inc.', 'Keysight Technologies Inc.', 'Teradyne Inc.', 'Skyworks Solutions Inc.',
    'NXP Semiconductors N.V.', 'CDW Corporation', 'PTC Inc.', 'Tyler Technologies Inc.', 'Zebra Technologies Corporation',
    'Trimble Inc.', 'Paycom Software Inc.', 'Ceridian HCM Holding Inc.', 'EPAM Systems Inc.', 'Gen Digital Inc.',
]

communication_services = [
    'Alphabet Inc.', 'Meta Platforms Inc.', 'Netflix Inc.', 'Comcast Corporation', 'Walt Disney Company',
    'Verizon Communications Inc.', 'AT&T Inc.', 'T-Mobile US Inc.', 'Charter Communications Inc.', 'Activision Blizzard Inc.',
    'Electronic Arts Inc.', 'Take-Two Interactive Software Inc.', 'Warner Bros. Discovery Inc.', 'Paramount Global', 'Fox Corporation',
    'Live Nation Entertainment Inc.', 'Omnicom Group Inc.', 'Interpublic Group of Companies Inc.', 'News Corporation', 'Match Group Inc.',
]

consumer_discretionary = [
    'Amazon.com Inc.', 'Tesla Inc.', 'Home Depot Inc.', 'McDonald\'s Corporation', 'Nike Inc.',
    'Lowe\'s Companies Inc.', 'Starbucks Corporation', 'Booking Holdings Inc.', 'TJX Companies Inc.', 'Target Corporation',
    'Chipotle Mexican Grill Inc.', 'General Motors Company', 'Ford Motor Company', 'Ross Stores Inc.', 'Marriott International Inc.',
    'Hilton Worldwide Holdings Inc.', 'O\'Reilly Automotive Inc.', 'AutoZone Inc.', 'Darden Restaurants Inc.', 'Yum! Brands Inc.',
    'Aptiv PLC', 'Expedia Group Inc.', 'Las Vegas Sands Corp.', 'Royal Caribbean Cruises Ltd.', 'Ulta Beauty Inc.',
    'Best Buy Co. Inc.', 'Dollar General Corporation', 'Dollar Tree Inc.', 'Genuine Parts Company', 'Bath & Body Works Inc.',
    'Caesars Entertainment Inc.', 'MGM Resorts International', 'Carnival Corporation', 'Norwegian Cruise Line Holdings Ltd.', 'Whirlpool Corporation',
    'Mohawk Industries Inc.', 'Etsy Inc.', 'eBay Inc.', 'CarMax Inc.', 'Tapestry Inc.',
]

consumer_staples = [
    'Procter & Gamble Company', 'Costco Wholesale Corporation', 'Walmart Inc.', 'Coca-Cola Company', 'PepsiCo Inc.',
    'Philip Morris International Inc.', 'Mondelez International Inc.', 'Altria Group Inc.', 'Colgate-Palmolive Company', 'General Mills Inc.',
    'Kimberly-Clark Corporation', 'Estee Lauder Companies Inc.', 'Kraft Heinz Company', 'Sysco Corporation', 'Archer-Daniels-Midland Company',
    'Kroger Company', 'Hershey Company', 'Kellogg Company', 'McCormick & Company Inc.', 'Constellation Brands Inc.',
    'Brown-Forman Corporation', 'Molson Coors Beverage Company', 'Campbell Soup Company', 'Hormel Foods Corporation', 'J.M. Smucker Company',
    'Church & Dwight Co. Inc.', 'Lamb Weston Holdings Inc.', 'Tyson Foods Inc.', 'Conagra Brands Inc.', 'Clorox Company',
]

health_care = [
    'UnitedHealth Group Inc.', 'Johnson & Johnson', 'Eli Lilly and Company', 'Merck & Co. Inc.', 'AbbVie Inc.',
    'Pfizer Inc.', 'Thermo Fisher Scientific Inc.', 'Abbott Laboratories', 'Danaher Corporation', 'Bristol-Myers Squibb Company',
    'Amgen Inc.', 'Gilead Sciences Inc.', 'CVS Health Corporation', 'Elevance Health Inc.', 'Intuitive Surgical Inc.',
    'Regeneron Pharmaceuticals Inc.', 'Vertex Pharmaceuticals Inc.', 'Cigna Group', 'Becton Dickinson and Company', 'Stryker Corporation',
    'Boston Scientific Corporation', 'Medtronic plc', 'Zoetis Inc.', 'Edwards Lifesciences Corporation', 'IDEXX Laboratories Inc.',
    'McKesson Corporation', 'HCA Healthcare Inc.', 'Humana Inc.', 'Centene Corporation', 'Molina Healthcare Inc.',
    'IQVIA Holdings Inc.', 'ResMed Inc.', 'Align Technology Inc.', 'West Pharmaceutical Services Inc.', 'DexCom Inc.',
    'Baxter International Inc.', 'Zimmer Biomet Holdings Inc.', 'Hologic Inc.', 'Biogen Inc.', 'Moderna Inc.',
    'Agilent Technologies Inc.', 'Bio-Rad Laboratories Inc.', 'Waters Corporation', 'Illumina Inc.', 'Viatris Inc.',
]

financials = [
    'Berkshire Hathaway Inc.', 'JPMorgan Chase & Co.', 'Visa Inc.', 'Mastercard Inc.', 'Bank of America Corporation',
    'Wells Fargo & Company', 'Morgan Stanley', 'Goldman Sachs Group Inc.', 'Charles Schwab Corporation', 'BlackRock Inc.',
    'S&P Global Inc.', 'Citigroup Inc.', 'American Express Company', 'PNC Financial Services Group Inc.', 'U.S. Bancorp',
    'Truist Financial Corporation', 'CME Group Inc.', 'Progressive Corporation', 'Chubb Limited', 'Intercontinental Exchange Inc.',
    'Marsh & McLennan Companies Inc.', 'Aon plc', 'MetLife Inc.', 'Aflac Incorporated', 'Travelers Companies Inc.',
    'American International Group Inc.', 'Prudential Financial Inc.', 'Allstate Corporation', 'Capital One Financial Corporation', 'Moody\'s Corporation',
    'MSCI Inc.', 'Discover Financial Services', 'Fifth Third Bancorp', 'KeyCorp', 'Huntington Bancshares Incorporated',
    'State Street Corporation', 'Northern Trust Corporation', 'Comerica Incorporated', 'Regions Financial Corporation', 'Zions Bancorporation',
    'M&T Bank Corporation', 'First Republic Bank', 'Synchrony Financial', 'Raymond James Financial Inc.', 'T. Rowe Price Group Inc.',
    'Franklin Resources Inc.', 'Invesco Ltd.', 'Ameriprise Financial Inc.', 'Principal Financial Group Inc.', 'Lincoln National Corporation',
]

industrials = [
    'Caterpillar Inc.', 'General Electric Company', 'Union Pacific Corporation', 'Honeywell International Inc.', 'Boeing Company',
    'RTX Corporation', 'United Parcel Service Inc.', 'Lockheed Martin Corporation', 'Deere & Company', 'Northrop Grumman Corporation',
    'General Dynamics Corporation', 'FedEx Corporation', 'CSX Corporation', 'Norfolk Southern Corporation', '3M Company',
    'L3Harris Technologies Inc.', 'Illinois Tool Works Inc.', 'Parker-Hannifin Corporation', 'Eaton Corporation plc', 'Emerson Electric Co.',
    'PACCAR Inc.', 'Trane Technologies plc', 'Johnson Controls International plc', 'Rockwell Automation Inc.', 'Carrier Global Corporation',
    'Fortive Corporation', 'AMETEK Inc.', 'Stanley Black & Decker Inc.', 'Dover Corporation', 'Otis Worldwide Corporation',
    'Cintas Corporation', 'Republic Services Inc.', 'Waste Management Inc.', 'Verisk Analytics Inc.', 'Copart Inc.',
    'Old Dominion Freight Line Inc.', 'JB Hunt Transport Services Inc.', 'CH Robinson Worldwide Inc.', 'Expeditors International of Washington Inc.', 'XPO Inc.',
    'Southwest Airlines Co.', 'Delta Air Lines Inc.', 'United Airlines Holdings Inc.', 'American Airlines Group Inc.', 'Alaska Air Group Inc.',
    'Howmet Aerospace Inc.', 'TransDigm Group Inc.', 'Textron Inc.', 'Leidos Holdings Inc.', 'Jacobs Solutions Inc.',
]

energy = [
    'Exxon Mobil Corporation', 'Chevron Corporation', 'ConocoPhillips', 'Schlumberger Limited', 'EOG Resources Inc.',
    'Pioneer Natural Resources Company', 'Marathon Petroleum Corporation', 'Phillips 66', 'Valero Energy Corporation', 'Occidental Petroleum Corporation',
    'Williams Companies Inc.', 'Kinder Morgan Inc.', 'Hess Corporation', 'Devon Energy Corporation', 'ONEOK Inc.',
    'Baker Hughes Company', 'Diamondback Energy Inc.', 'Halliburton Company', 'Coterra Energy Inc.', 'Marathon Oil Corporation',
    'Targa Resources Corp.', 'APA Corporation', 'EQT Corporation', 'Ovintiv Inc.',
]

utilities = [
    'NextEra Energy Inc.', 'Duke Energy Corporation', 'Southern Company', 'Dominion Energy Inc.', 'American Electric Power Company Inc.',
    'Sempra', 'Exelon Corporation', 'Xcel Energy Inc.', 'WEC Energy Group Inc.', 'Consolidated Edison Inc.',
    'Public Service Enterprise Group Inc.', 'Eversource Energy', 'Edison International', 'DTE Energy Company', 'Entergy Corporation',
    'CenterPoint Energy Inc.', 'Ameren Corporation', 'PPL Corporation', 'FirstEnergy Corp.', 'Atmos Energy Corporation',
    'AES Corporation', 'CMS Energy Corporation', 'Evergy Inc.', 'Alliant Energy Corporation', 'Pinnacle West Capital Corporation',
    'NiSource Inc.', 'NRG Energy Inc.', 'American Water Works Company Inc.',
]

real_estate = [
    'Prologis Inc.', 'American Tower Corporation', 'Equinix Inc.', 'Crown Castle Inc.', 'Public Storage',
    'Realty Income Corporation', 'Digital Realty Trust Inc.', 'Simon Property Group Inc.', 'Welltower Inc.', 'CBRE Group Inc.',
    'Extra Space Storage Inc.', 'SBA Communications Corporation', 'AvalonBay Communities Inc.', 'Equity Residential', 'Ventas Inc.',
    'Alexandria Real Estate Equities Inc.', 'Vornado Realty Trust', 'Boston Properties Inc.', 'Invitation Homes Inc.', 'Iron Mountain Inc.',
    'Kimco Realty Corporation', 'Mid-America Apartment Communities Inc.', 'Essex Property Trust Inc.', 'UDR Inc.', 'Healthpeak Properties Inc.',
    'Host Hotels & Resorts Inc.', 'Regency Centers Corporation', 'Federal Realty Investment Trust', 'Camden Property Trust', 'Sun Communities Inc.',
]

materials = [
    'Linde plc', 'Sherwin-Williams Company', 'Air Products and Chemicals Inc.', 'Freeport-McMoRan Inc.', 'Ecolab Inc.',
    'Newmont Corporation', 'Nucor Corporation', 'DuPont de Nemours Inc.', 'PPG Industries Inc.', 'Dow Inc.',
    'Corteva Inc.', 'CF Industries Holdings Inc.', 'Ball Corporation', 'Vulcan Materials Company', 'Martin Marietta Materials Inc.',
    'International Paper Company', 'Packaging Corporation of America', 'Avery Dennison Corporation', 'Albemarle Corporation', 'Celanese Corporation',
    'FMC Corporation', 'Westrock Company', 'Sealed Air Corporation', 'Eastman Chemical Company', 'International Flavors & Fragrances Inc.',
    'Mosaic Company', 'Steel Dynamics Inc.', 'Cleveland-Cliffs Inc.', 'Reliance Steel & Aluminum Co.', 'Amcor plc',
]

# Combine all companies
all_companies = (
    information_technology +
    communication_services +
    consumer_discretionary +
    consumer_staples +
    health_care +
    financials +
    industrials +
    energy +
    utilities +
    real_estate +
    materials
)

# Remove duplicates while preserving order
seen = set()
unique_companies = []
for c in all_companies:
    if c not in seen:
        seen.add(c)
        unique_companies.append(c)

all_companies = unique_companies

# Map companies to their sectors
company_sectors = {}
for c in information_technology:
    company_sectors[c] = 'Information Technology'
for c in communication_services:
    company_sectors[c] = 'Communication Services'
for c in consumer_discretionary:
    company_sectors[c] = 'Consumer Discretionary'
for c in consumer_staples:
    company_sectors[c] = 'Consumer Staples'
for c in health_care:
    company_sectors[c] = 'Health Care'
for c in financials:
    company_sectors[c] = 'Financials'
for c in industrials:
    company_sectors[c] = 'Industrials'
for c in energy:
    company_sectors[c] = 'Energy'
for c in utilities:
    company_sectors[c] = 'Utilities'
for c in real_estate:
    company_sectors[c] = 'Real Estate'
for c in materials:
    company_sectors[c] = 'Materials'

# Generate descriptions based on sector
sector_descriptions = {
    'Information Technology': 'A leading technology company focused on software, hardware, semiconductors, or IT services.',
    'Communication Services': 'A company providing telecommunications, media, or entertainment services.',
    'Consumer Discretionary': 'A consumer-focused company in retail, automotive, hospitality, or leisure sectors.',
    'Consumer Staples': 'A company providing essential consumer products including food, beverages, and household goods.',
    'Health Care': 'A healthcare company involved in pharmaceuticals, biotechnology, medical devices, or healthcare services.',
    'Financials': 'A financial services company providing banking, insurance, investment, or asset management solutions.',
    'Industrials': 'An industrial company in aerospace, defense, machinery, transportation, or business services.',
    'Energy': 'An energy company involved in oil, gas, or energy infrastructure.',
    'Utilities': 'A utility company providing electric, gas, or water services.',
    'Real Estate': 'A real estate investment trust (REIT) or real estate services company.',
    'Materials': 'A materials company in chemicals, metals, mining, or packaging.',
}

# Generate nodes
nodes = []
for i, company_name in enumerate(all_companies):
    node_id = f"c_{i}"
    sector = company_sectors.get(company_name, 'Industrials')
    
    is_crypto = random.random() > 0.95  # 5% chance for TVL (Total Value Locked)
    
    # Generate realistic price based on sector
    if sector == 'Information Technology':
        base_price = random.uniform(100, 800)
    elif sector == 'Financials':
        base_price = random.uniform(50, 500)
    elif sector == 'Health Care':
        base_price = random.uniform(80, 600)
    elif sector == 'Energy':
        base_price = random.uniform(40, 200)
    elif sector == 'Utilities':
        base_price = random.uniform(30, 120)
    elif sector == 'Real Estate':
        base_price = random.uniform(50, 300)
    elif sector == 'Materials':
        base_price = random.uniform(40, 250)
    elif sector == 'Consumer Staples':
        base_price = random.uniform(50, 300)
    elif sector == 'Consumer Discretionary':
        base_price = random.uniform(50, 500)
    elif sector == 'Communication Services':
        base_price = random.uniform(50, 400)
    else:
        base_price = random.uniform(50, 300)
    
    description = f"{sector_descriptions.get(sector, 'A leading company in its industry.')} {company_name} is a constituent of the S&P 500 index."
    
    nodes.append({
        'id': node_id,
        'name': company_name,
        'type': 'company',
        'sector': sector,
        'val': random.uniform(5, 25),
        'description': description,
        'price': round(base_price, 2),
        'change': round(random.uniform(-8, 8), 2),
        'tvl': round(random.uniform(100000000, 5000000000), 2) if is_crypto else None,
        'volume': round(random.uniform(1000000, 50000000), 2)
    })

# Generate links (relationships)
links = []
relationship_types = ['partnership', 'ownership', 'investment', 'supplier', 'competitor']

for i in range(len(nodes)):
    source = nodes[i]['id']
    source_sector = nodes[i]['sector']
    num_links = random.randint(1, 5)
    
    for _ in range(num_links):
        target_idx = random.randint(0, len(nodes) - 1)
        if target_idx != i:
            # Increase chance of same-sector relationships
            if random.random() > 0.6:
                # Try to find a same-sector company
                same_sector_indices = [j for j, n in enumerate(nodes) if n['sector'] == source_sector and j != i]
                if same_sector_indices:
                    target_idx = random.choice(same_sector_indices)
            
            link_type = random.choice(relationship_types)
            links.append({
                'source': source,
                'target': nodes[target_idx]['id'],
                'type': link_type
            })

# Remove duplicate links
seen_links = set()
unique_links = []
for link in links:
    key = (link['source'], link['target'], link['type'])
    if key not in seen_links:
        seen_links.add(key)
        unique_links.append(link)

links = unique_links

# Create final data structure
data = {
    'nodes': nodes,
    'links': links
}

# Write to JSON file
with open('src/data/companies.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f'Generated JSON file with {len(nodes)} S&P 500 companies and {len(links)} relationships')
