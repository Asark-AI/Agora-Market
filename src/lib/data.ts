

export const regions = [
    { id: 'reg-1', name: 'Ashanti' },
    { id: 'reg-2', name: 'Greater Accra' },
    { id: 'reg-3', name: 'Central' },
    { id: 'reg-4', name: 'Eastern' },
    { id: 'reg-5', name: 'Western' },
    { id: 'reg-6', name: 'Volta' },
    { id: 'reg-7', name: 'Northern' },
    { id: 'reg-8', name: 'Upper East' },
    { id: 'reg-9', name: 'Upper West' },
    { id: 'reg-10', name: 'Bono' },
    { id: 'reg-11', name: 'Bono East' },
    { id: 'reg-12', name: 'Ahafo' },
    { id: 'reg-13', name: 'Savannah' },
    { id: 'reg-14', name: 'North East' },
    { id: 'reg-15', name: 'Oti' },
    { id: 'reg-16', name: 'Western North' },
];

export const mobileGroupedCategories = [
    // Based on the new Buyer App structure
    {
        sectionTitle: 'Goods & Products',
        businessType: 'store' as const,
        categories: [
            {
                groupTitle: 'Vehicles',
                links: [
                    { name: 'Cars', id: 'vehicles-cars' },
                    { name: 'Buses & Microbuses', id: 'vehicles-buses' },
                    { name: 'Heavy Equipment', id: 'vehicles-heavy-equipment' },
                    { name: 'Motorcycles & Scooters', id: 'vehicles-motorcycles' },
                    { name: 'Trucks & Trailers', id: 'vehicles-trucks' },
                    { name: 'Boats & Watercraft', id: 'vehicles-boats' },
                    { name: 'Vehicle Parts & Accessories', id: 'vehicles-parts' },
                    { name: 'Car Audio & GPS', id: 'vehicles-audio-gps' },
                    { name: 'Car Care Products', id: 'vehicles-care' },
                ]
            },
            {
                groupTitle: 'Mobile Phones & Tablets',
                links: [
                    { name: 'Mobile Phones', id: 'mobile-phones' },
                    { name: 'Tablets', id: 'mobile-tablets' },
                    { name: 'Smart Watches & Trackers', id: 'mobile-smart-watches' },
                    { name: 'Accessories for Phones & Tablets', id: 'mobile-accessories' },
                    { name: 'Power Banks & Chargers', id: 'mobile-power-banks' },
                    { name: 'VR & AR Devices', id: 'mobile-vr-ar' },
                ]
            },
            {
                groupTitle: 'Electronics',
                links: [
                    { name: 'Laptops & Computers', id: 'electronics-laptops' },
                    { name: 'TV, Audio & Video', id: 'electronics-tv-audio' },
                    { name: 'Cameras & Drones', id: 'electronics-cameras' },
                    { name: 'Computer Hardware', id: 'electronics-hardware' },
                    { name: 'Computer Accessories', id: 'electronics-accessories' },
                    { name: 'Printers & Scanners', id: 'electronics-printers' },
                    { name: 'Networking Products', id: 'electronics-networking' },
                    { name: 'Video Games & Consoles', id: 'electronics-gaming' },
                    { name: 'Smart Home Devices', id: 'electronics-smart-home' },
                    { name: 'Solar & Inverters', id: 'electronics-solar' },
                ]
            },
            {
                groupTitle: 'Home & Office',
                links: [
                    { name: 'Furniture', id: 'home-furniture' },
                    { name: 'Home Appliances', id: 'home-appliances' },
                    { name: 'Kitchen Appliances', id: 'home-kitchen-appliances' },
                    { name: 'Home & Garden', id: 'home-garden' },
                    { name: 'Office Supplies', id: 'home-office-supplies' },
                    { name: 'Lighting & Decor', id: 'home-lighting-decor' },
                    { name: 'Security & Surveillance', id: 'home-security' },
                    { name: 'Bedding & Curtains', id: 'home-bedding' },
                    { name: 'Tools & Hardware', id: 'home-tools' },
                ]
            },
            {
                groupTitle: 'Health & Beauty',
                links: [
                    { name: 'Fragrances', id: 'health-fragrances' },
                    { name: 'Makeup', id: 'health-makeup' },
                    { name: 'Hair Care', id: 'health-hair-care' },
                    { name: 'Skin Care', id: 'health-skin-care' },
                    { name: 'Vitamins & Supplements', id: 'health-supplements' },
                    { name: 'Personal Care & Hygiene', id: 'health-personal-care' },
                    { name: 'Medical Supplies & Equipment', id: 'health-medical-supplies' },
                    { name: 'Weight Loss & Fitness Products', id: 'health-fitness-products' },
                ]
            },
            {
                groupTitle: 'Fashion',
                links: [
                    { name: "Women's Clothing", id: 'fashion-womens-clothing' },
                    { name: "Men's Clothing", id: 'fashion-mens-clothing' },
                    { name: 'Shoes', id: 'fashion-shoes' },
                    { name: 'Bags', id: 'fashion-bags' },
                    { name: 'Jewelry & Accessories', id: 'fashion-jewelry' },
                    { name: 'Watches', id: 'fashion-watches' },
                    { name: 'Traditional & Cultural Wear', id: 'fashion-traditional-wear' },
                    { name: 'Sportswear', id: 'fashion-sportswear' },
                    { name: 'Sunglasses & Eyewear', id: 'fashion-eyewear' },
                    { name: 'Lingerie & Sleepwear', id: 'fashion-lingerie' },
                ]
            },
            {
                groupTitle: 'Babies & Kids',
                links: [
                    { name: "Children's Clothing", id: 'kids-clothing' },
                    { name: "Children's Shoes", id: 'kids-shoes' },
                    { name: 'Toys & Games', id: 'kids-toys' },
                    { name: 'Maternity & Pregnancy', id: 'kids-maternity' },
                    { name: 'Baby & Child Care Products', id: 'kids-care-products' },
                    { name: 'Baby Furniture & Equipment', id: 'kids-furniture' },
                    { name: 'School Supplies', id: 'kids-school-supplies' },
                ]
            },
            {
                groupTitle: 'Agriculture & Food',
                links: [
                    { name: 'Farm Machinery & Equipment', id: 'agric-machinery' },
                    { name: 'Livestock & Poultry', id: 'agric-livestock' },
                    { name: 'Feeds, Supplements & Seeds', id: 'agric-feeds' },
                    { name: 'Food & Groceries', id: 'agric-food' },
                    { name: 'Fishery & Aquaculture', id: 'agric-fishery' },
                    { name: 'Agrochemicals', id: 'agric-chemicals' },
                ]
            },
            {
                groupTitle: 'Sports, Arts & Hobbies',
                links: [
                    { name: 'Musical Instruments', id: 'hobbies-instruments' },
                    { name: 'Sports Equipment', id: 'hobbies-sports-equipment' },
                    { name: 'Books & Stationery', id: 'hobbies-books' },
                    { name: 'Art & Collectibles', id: 'hobbies-art' },
                    { name: 'Outdoor & Camping Gear', id: 'hobbies-camping' },
                    { name: 'Board Games & Puzzles', id: 'hobbies-games' },
                    { name: 'Gym & Fitness Equipment', id: 'hobbies-gym-equipment' },
                ]
            },
            {
                groupTitle: 'Pets',
                links: [
                    { name: 'Dogs & Puppies', id: 'pets-dogs' },
                    { name: 'Cats & Kittens', id: 'pets-cats' },
                    { name: 'Birds', id: 'pets-birds' },
                    { name: 'Fish & Aquariums', id: 'pets-fish' },
                    { name: 'Pet Accessories', id: 'pets-accessories' },
                    { name: 'Pet Food', id: 'pets-food' },
                ]
            },
            {
                groupTitle: 'Industrial & Business Equipment',
                links: [
                    { name: 'Industrial Machinery', id: 'industrial-machinery' },
                    { name: 'Manufacturing Equipment', id: 'industrial-manufacturing' },
                    { name: 'Packaging & Printing', id: 'industrial-packaging' },
                    { name: 'Restaurant & Catering', id: 'industrial-restaurant' },
                    { name: 'Shop & Retail Equipment', id: 'industrial-retail-equipment' },
                    { name: 'Medical & Lab Equipment', id: 'industrial-medical-equipment' },
                    { name: 'Power Tools & Generators', id: 'industrial-power-tools' },
                ]
            }
        ]
    },
    // REPAIR SERVICES
    {
        sectionTitle: 'Repair Service Categories',
        businessType: 'repairs' as const,
        categories: [
            {
                groupTitle: 'Repair Services',
                links: [
                    { name: 'Phone & Tablet Repair', id: 'repair-phones' },
                    { name: 'Computer & Laptop Repair', id: 'repair-computers' },
                    { name: 'TV & Audio Repair', id: 'repair-tvaudio' },
                    { name: 'Game Console Repair', id: 'repair-consoles' },
                    { name: 'Fridge & Freezer Repair', id: 'repair-fridges' },
                    { name: 'Washing Machine Repair', id: 'repair-washing-machines' },
                    { name: 'AC & Fan Repair', id: 'repair-ac' },
                    { name: 'Stove & Oven Repair', id: 'repair-ovens' },
                    { name: 'Car Mechanic Services', id: 'repair-cars' },
                    { name: 'Motorcycle Repair', id: 'repair-motorcycles' },
                    { name: 'Auto Electrical Services', id: 'repair-auto-electrical' },
                ]
            }
        ]
    },
    // GENERAL SERVICES
    {
        sectionTitle: 'Service Categories',
        businessType: 'services' as const,
        categories: [
             {
                groupTitle: 'Property Services',
                links: [
                    { name: 'Houses & Apartments for Rent', id: 'property-rent-house' },
                    { name: 'Houses & Apartments for Sale', id: 'property-sale-house' },
                    { name: 'Land & Plots for Rent', id: 'property-rent-land' },
                    { name: 'Land & Plots for Sale', id: 'property-sale-land' },
                    { name: 'Commercial Property for Rent', id: 'property-rent-commercial' },
                    { name: 'Commercial Property for Sale', id: 'property-sale-commercial' },
                    { name: 'Short Let / Airbnb', id: 'property-short-let' },
                    { name: 'Event Centers & Venues', id: 'property-event-venues' },
                    { name: 'Co-working Spaces', id: 'property-coworking' },
                    { name: 'Hotels & Lodges', id: 'property-hotels' },
                ]
            },
            {
                groupTitle: 'Business & Professional',
                links: [
                    { name: 'Automotive Services', id: 'services-automotive' },
                    { name: 'Building & Trade', id: 'services-building-trade' },
                    { name: 'Cleaning Services', id: 'services-cleaning' },
                    { name: 'Computer & IT', id: 'services-it' },
                    { name: 'Legal & Financial', id: 'services-legal-financial' },
                    { name: 'Printing & Branding', id: 'services-printing' },
                    { name: 'Security Services', id: 'services-security' },
                ]
            },
            {
                groupTitle: 'Events & Creative',
                links: [
                    { name: 'DJ & Entertainment', id: 'services-dj-entertainment' },
                    { name: 'Event Planning & Catering', id: 'services-event-planning' },
                    { name: 'Photography & Video', id: 'services-photography' },
                ]
            },
             {
                groupTitle: 'Health & Wellness',
                links: [
                     { name: 'Health & Wellness Services', id: 'services-health-wellness' },
                ]
            },
            {
                groupTitle: 'Logistics & Training',
                links: [
                    { name: 'Courier & Delivery', id: 'services-courier-delivery' },
                    { name: 'Educational & Training', id: 'services-educational' },
                     { name: 'Vehicle Leasing & Rentals', id: 'services-vehicle-rental' },
                     { name: 'Tours & Travel Packages', id: 'services-tours' },
                ]
            },
            {
                groupTitle: 'Other Services',
                links: [
                    { name: 'Manufacturing Services', id: 'services-manufacturing', businessType: 'manufacturing' },
                    { name: 'Repair Services', id: 'services-repair', businessType: 'repairs' },
                ]
            }
        ]
    },
    // MANUFACTURING
    {
        sectionTitle: 'Manufacturing Categories',
        businessType: 'manufacturing' as const,
        categories: [
            {
                groupTitle: 'Manufacturing Capabilities',
                links: [
                    { name: 'Industrial Equipment', id: 'mfg-industrial-equip' },
                    { name: 'Agricultural Machinery', id: 'mfg-agric-machine' },
                    { name: 'Construction Materials', id: 'mfg-construction-mat' },
                    { name: 'Custom Furniture', id: 'mfg-custom-furniture' },
                    { name: 'Custom Fashion & Textiles', id: 'mfg-custom-fashion' },
                    { name: 'Metal Fabrication', id: 'mfg-metal-fab' },
                    { name: 'Woodworking', id: 'mfg-woodworking' },
                    { name: 'Packaging & Printing', id: 'mfg-packaging-printing' },
                ]
            }
        ]
    },
];

// Flatten the grouped categories into a single array for easier use in forms/listings
export const categories = mobileGroupedCategories.flatMap(section =>
    section.categories.flatMap(group =>
        group.links.map(link => {
            let itemType: 'product' | 'service';
            
            // Explicit businessType on link wins
            if ('businessType' in link && link.businessType) {
                itemType = (link.businessType === 'store' || link.businessType === 'manufacturing') ? 'product' : 'service';
            }
            // Fallback to section-level businessType
            else {
                itemType = (section.businessType === 'store' || section.businessType === 'manufacturing') ? 'product' : 'service';
            }
            
            return {
                id: link.id,
                name: link.name,
                type: itemType,
                parent: group.groupTitle,
                businessType: ('businessType' in link && link.businessType) ? link.businessType : section.businessType
            }
        })
    )
);

