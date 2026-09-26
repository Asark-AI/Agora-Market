export type ElectronicsCategoryNode = {
  id: string;
  name: string;
  children?: ElectronicsCategoryNode[];
};

const node = (id: string, name: string, children: Array<[string, string]> = []): ElectronicsCategoryNode => ({
  id,
  name,
  children: children.map(([childId, childName]) => ({ id: childId, name: childName })),
});

export const electronicsCategoryTree: ElectronicsCategoryNode[] = [
  node('computers-laptops', 'Computers & Laptops', [
    ['laptops', 'Laptops'], ['business-laptops', 'Business Laptops'], ['gaming-laptops', 'Gaming Laptops'], ['student-laptops', 'Student Laptops'], ['convertible-laptops', '2-in-1 / Convertible Laptops'], ['macbooks', 'MacBooks'], ['chromebooks', 'Chromebooks'], ['desktop-pcs', 'Desktop PCs'], ['gaming-pcs', 'Gaming PCs'], ['workstation-pcs', 'Workstation PCs'], ['mini-pcs', 'Mini PCs'], ['all-in-one-pcs', 'All-in-One PCs'], ['refurbished-laptops', 'Refurbished Laptops'], ['refurbished-desktops', 'Refurbished Desktop PCs'], ['monitors', 'Monitors'], ['portable-monitors', 'Portable Monitors'],
  ]),
  node('computer-components', 'Computer Components', [
    ['processors', 'CPUs / Processors'], ['motherboards', 'Motherboards'], ['ram-memory', 'RAM / Memory'], ['graphics-cards', 'Graphics Cards / GPUs'], ['ssds', 'SSDs'], ['hard-drives', 'HDDs'], ['power-supplies', 'Power Supplies / PSUs'], ['pc-cases', 'PC Cases'], ['cpu-coolers', 'CPU Coolers'], ['case-fans', 'Case Fans'], ['liquid-cooling', 'Liquid Cooling'], ['capture-cards', 'Capture Cards'],
  ]),
  node('computer-accessories', 'Computer Accessories', [
    ['keyboards', 'Keyboards'], ['mechanical-keyboards', 'Mechanical Keyboards'], ['wireless-keyboards', 'Wireless Keyboards'], ['gaming-keyboards', 'Gaming Keyboards'], ['mice', 'Mice'], ['gaming-mice', 'Gaming Mice'], ['mouse-pads', 'Mouse Pads'], ['webcams', 'Webcams'], ['microphones', 'Microphones'], ['headsets', 'Headsets'], ['headphones', 'Headphones'], ['usb-hubs', 'USB Hubs'], ['docking-stations', 'Docking Stations'], ['laptop-stands', 'Laptop Stands'],
  ]),
  node('storage-memory', 'Storage & Memory', [
    ['internal-ssds', 'Internal SSDs'], ['external-ssds', 'External SSDs'], ['sata-ssds', 'SATA SSDs'], ['nvme-ssds', 'NVMe SSDs'], ['internal-hdds', 'Internal HDDs'], ['external-hdds', 'External HDDs'], ['usb-flash-drives', 'USB Flash Drives'], ['memory-cards', 'Memory Cards'], ['microsd-cards', 'MicroSD Cards'], ['nas-storage', 'NAS Storage'], ['storage-enclosures', 'Storage Enclosures'],
  ]),
  node('cables-adapters-connectivity', 'Cables, Adapters & Connectivity', [
    ['hdmi-cables', 'HDMI Cables'], ['displayport-cables', 'DisplayPort Cables'], ['usb-cables', 'USB-C Cables'], ['thunderbolt-cables', 'Thunderbolt Cables'], ['ethernet-cables', 'Ethernet / LAN Cables'], ['audio-cables', 'Audio Cables'], ['power-cables', 'Power Cables'], ['adapters', 'Adapters'], ['converters', 'Converters'], ['splitters', 'Splitters'], ['cable-management', 'Cable Management'],
  ]),
  node('networking-internet', 'Networking & Internet', [
    ['wifi-routers', 'Wi-Fi Routers'], ['4g-routers', '4G LTE Routers'], ['5g-routers', '5G Routers'], ['mifi', 'Mobile Wi-Fi / MiFi'], ['modems', 'Modems'], ['network-switches', 'Network Switches'], ['managed-switches', 'Managed Switches'], ['poe-switches', 'PoE Switches'], ['wifi-access-points', 'Wi-Fi Access Points'], ['wifi-extenders', 'Wi-Fi Extenders'], ['mesh-wifi', 'Mesh Wi-Fi Systems'], ['network-tools', 'Network Tools'], ['fiber-equipment', 'Fiber Optic Equipment'],
  ]),
  node('cctv-security-surveillance', 'CCTV, Security & Surveillance', [
    ['cctv-cameras', 'CCTV Cameras'], ['ip-cameras', 'IP Cameras'], ['wifi-cameras', 'Wi-Fi Cameras'], ['ptz-cameras', 'PTZ Cameras'], ['outdoor-cameras', 'Outdoor Cameras'], ['nvr', 'NVRs'], ['dvr', 'DVRs'], ['cctv-hard-drives', 'CCTV Hard Drives'], ['video-doorbells', 'Video Doorbells'], ['access-control', 'Access Control Systems'], ['electric-locks', 'Electric Locks'], ['intercom-systems', 'Intercom Systems'], ['alarm-systems', 'Alarm Systems'], ['security-bundles', 'Security System Bundles'],
  ]),
  node('printers-scanners-office', 'Printers, Scanners & Office Equipment', [
    ['inkjet-printers', 'Inkjet Printers'], ['laser-printers', 'Laser Printers'], ['all-in-one-printers', 'All-in-One Printers'], ['thermal-printers', 'Thermal Printers'], ['label-printers', 'Label Printers'], ['receipt-printers', 'Receipt Printers'], ['pos-printers', 'POS Printers'], ['scanners', 'Scanners'], ['barcode-scanners', 'Barcode Scanners'], ['projectors', 'Projectors'], ['toners-ink', 'Toners & Ink Cartridges'], ['office-equipment', 'Office Equipment'],
  ]),
  node('gaming', 'Gaming', [
    ['gaming-monitors', 'Gaming Monitors'], ['gaming-keyboards', 'Gaming Keyboards'], ['gaming-mice', 'Gaming Mice'], ['gaming-headsets', 'Gaming Headsets'], ['game-controllers', 'Game Controllers'], ['racing-wheels', 'Racing Wheels'], ['vr-headsets', 'VR Headsets'], ['streaming-equipment', 'Streaming Equipment'], ['gaming-chairs', 'Gaming Chairs'], ['gaming-desks', 'Gaming Desks'], ['rgb-lighting', 'RGB Lighting'],
  ]),
  node('power-charging-backup', 'Power, Charging & Backup', [
    ['ups-systems', 'UPS Systems'], ['online-ups', 'Online UPS'], ['surge-protectors', 'Surge Protectors'], ['extension-boards', 'Extension Boards'], ['laptop-chargers', 'Laptop Chargers'], ['usb-chargers', 'USB Chargers'], ['gan-chargers', 'GaN Chargers'], ['power-banks', 'Power Banks'], ['portable-power-stations', 'Portable Power Stations'], ['inverters', 'Inverters'], ['backup-batteries', 'Backup Batteries'], ['solar-chargers', 'Solar Chargers'],
  ]),
  node('repair-replacement-parts', 'Computer Repair & Replacement Parts', [
    ['laptop-batteries', 'Laptop Batteries'], ['laptop-screens', 'Laptop Screens'], ['laptop-keyboards', 'Laptop Keyboards'], ['laptop-fans', 'Laptop Fans'], ['laptop-motherboards', 'Laptop Motherboards'], ['desktop-parts', 'Desktop Replacement Parts'], ['dc-power-jacks', 'DC Power Jacks'], ['repair-tools', 'Repair Tools'], ['soldering-equipment', 'Soldering Equipment'], ['cleaning-kits', 'Cleaning Kits'], ['anti-static-equipment', 'ESD / Anti-Static Equipment'],
  ]),
  node('tablets-mobile-computing', 'Tablets & Mobile Computing', [
    ['tablets', 'Tablets'], ['android-tablets', 'Android Tablets'], ['ipads', 'iPads'], ['windows-tablets', 'Windows Tablets'], ['e-readers', 'E-Readers'], ['drawing-tablets', 'Drawing Tablets'], ['tablet-keyboards', 'Tablet Keyboards'], ['tablet-cases', 'Tablet Cases'], ['tablet-styluses', 'Tablet Styluses'],
  ]),
  node('business-enterprise-it', 'Business & Enterprise IT', [
    ['servers', 'Servers'], ['server-racks', 'Server Racks'], ['server-components', 'Server Components'], ['nas-systems', 'NAS Systems'], ['enterprise-storage', 'Enterprise Storage'], ['enterprise-networking', 'Enterprise Networking'], ['firewalls', 'Firewalls'], ['kvm-switches', 'KVM Switches'], ['pos-systems', 'POS Systems'], ['business-computers', 'Business Computers'], ['conference-equipment', 'Conference Room Equipment'],
  ]),
  node('audio-video-streaming', 'Audio, Video & Streaming', [
    ['usb-microphones', 'USB Microphones'], ['wireless-microphones', 'Wireless Microphones'], ['studio-microphones', 'Studio Microphones'], ['earphones', 'Earphones'], ['bluetooth-speakers', 'Bluetooth Speakers'], ['audio-interfaces', 'Audio Interfaces'], ['mixers', 'Mixers'], ['streaming-cameras', 'Streaming Cameras'], ['stream-decks', 'Stream Decks'], ['ring-lights', 'Ring Lights'], ['studio-lighting', 'Studio Lighting'],
  ]),
  node('smart-home-iot', 'Smart Home & IoT', [
    ['smart-cameras', 'Smart Cameras'], ['smart-doorbells', 'Smart Doorbells'], ['smart-locks', 'Smart Locks'], ['smart-plugs', 'Smart Plugs'], ['smart-switches', 'Smart Switches'], ['smart-bulbs', 'Smart Bulbs'], ['smart-sensors', 'Smart Sensors'], ['smart-hubs', 'Smart Hubs'], ['smart-speakers', 'Smart Speakers'], ['smart-displays', 'Smart Displays'], ['iot-devices', 'IoT Devices'],
  ]),
  node('tools-electronics', 'Tools & Electronics', [
    ['multimeters', 'Multimeters'], ['digital-testers', 'Digital Testers'], ['soldering-irons', 'Soldering Irons'], ['oscilloscopes', 'Oscilloscopes'], ['bench-power-supplies', 'Bench Power Supplies'], ['wire-strippers', 'Wire Strippers'], ['crimping-tools', 'Crimping Tools'], ['precision-screwdrivers', 'Precision Screwdrivers'], ['electronics-tool-kits', 'Electronics Tool Kits'],
  ]),
  node('electronics-development', 'Electronics & Development', [
    ['arduino-boards', 'Arduino Boards'], ['esp32-boards', 'ESP32 Boards'], ['raspberry-pi', 'Raspberry Pi'], ['microcontrollers', 'Microcontrollers'], ['development-boards', 'Development Boards'], ['sensors-modules', 'Sensors & Modules'], ['displays', 'Displays'], ['leds', 'LEDs'], ['electronic-components', 'Electronic Components'], ['breadboards', 'Breadboards'], ['robotics-kits', 'Robotics Kits'], ['diy-electronics-kits', 'DIY Electronics Kits'],
  ]),
  node('displays-presentation', 'Displays & Presentation', [
    ['computer-monitors', 'Computer Monitors'], ['professional-monitors', 'Professional Monitors'], ['4k-monitors', '4K Monitors'], ['ultrawide-monitors', 'Ultrawide Monitors'], ['digital-signage', 'Digital Signage Displays'], ['interactive-displays', 'Interactive Displays'], ['conference-displays', 'Conference Room Displays'], ['display-adapters', 'Display Adapters'], ['display-splitters', 'Display Splitters'],
  ]),
];

export const electronicsCategories = electronicsCategoryTree.flatMap((department) =>
  (department.children || []).map((category) => ({
    id: category.id,
    name: category.name,
    type: 'product' as const,
    parent: department.name,
    department: department.name,
    path: `${department.name} / ${category.name}`,
  }))
);
