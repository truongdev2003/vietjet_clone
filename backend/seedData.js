const mongoose = require('mongoose');
const Airport = require('./models/Airport');
const Flight = require('./models/Flight');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Fare = require('./models/Fare');
const Route = require('./models/Route');
const Aircraft = require('./models/Aircraft');
const Airline = require('./models/Airline');
const Crew = require('./models/Crew');
const Service = require('./models/Service');
const Schedule = require('./models/Schedule');
const Inventory = require('./models/Inventory');
const { Promotion, Additional } = require('./models/Additional');
require('dotenv').config();

// Helper function to create sample data with loop
const createSampleData = () => {
  const airports = [];
  const airportData = [
    // Major International Hubs
    { code: 'SGN', iata: 'SGN', icao: 'VVTS', nameVi: 'Sân bay Quốc tế Tân Sơn Nhất', nameEn: 'Tan Son Nhat International Airport', cityVi: 'TP. Hồ Chí Minh', cityEn: 'Ho Chi Minh City', provinceVi: 'TP. Hồ Chí Minh', provinceEn: 'Ho Chi Minh City', lat: 10.8188, lng: 106.6519, elevation: 10, isHub: true, type: 'international' },
    { code: 'HAN', iata: 'HAN', icao: 'VVNB', nameVi: 'Sân bay Quốc tế Nội Bài', nameEn: 'Noi Bai International Airport', cityVi: 'Hà Nội', cityEn: 'Hanoi', provinceVi: 'Hà Nội', provinceEn: 'Hanoi', lat: 21.2187, lng: 105.8044, elevation: 12, isHub: true, type: 'international' },
    { code: 'DAD', iata: 'DAD', icao: 'VVDN', nameVi: 'Sân bay Quốc tế Đà Nẵng', nameEn: 'Da Nang International Airport', cityVi: 'Đà Nẵng', cityEn: 'Da Nang', provinceVi: 'Đà Nẵng', provinceEn: 'Da Nang', lat: 16.0439, lng: 108.1995, elevation: 3, isHub: false, type: 'international' },
    
    // Popular Tourist Destinations
    { code: 'CXR', iata: 'CXR', icao: 'VVCR', nameVi: 'Sân bay Quốc tế Cam Ranh', nameEn: 'Cam Ranh International Airport', cityVi: 'Nha Trang', cityEn: 'Nha Trang', provinceVi: 'Khánh Hòa', provinceEn: 'Khanh Hoa', lat: 11.9982, lng: 109.2193, elevation: 6, isHub: false, type: 'international' },
    { code: 'PQC', iata: 'PQC', icao: 'VVPQ', nameVi: 'Sân bay Quốc tế Phú Quốc', nameEn: 'Phu Quoc International Airport', cityVi: 'Phú Quốc', cityEn: 'Phu Quoc', provinceVi: 'Kiên Giang', provinceEn: 'Kien Giang', lat: 10.2269, lng: 103.9674, elevation: 4, isHub: false, type: 'international' },
    { code: 'VDO', iata: 'VDO', icao: 'VVVD', nameVi: 'Sân bay Quốc tế Vân Đồn', nameEn: 'Van Don International Airport', cityVi: 'Vân Đồn', cityEn: 'Van Don', provinceVi: 'Quảng Ninh', provinceEn: 'Quang Ninh', lat: 21.1132, lng: 107.4186, elevation: 5, isHub: false, type: 'international' },
    { code: 'DLI', iata: 'DLI', icao: 'VVDL', nameVi: 'Sân bay Liên Khương', nameEn: 'Lien Khuong Airport', cityVi: 'Đà Lạt', cityEn: 'Da Lat', provinceVi: 'Lâm Đồng', provinceEn: 'Lam Dong', lat: 11.7503, lng: 108.3669, elevation: 962, isHub: false, type: 'domestic' },
    
    // Regional Airports
    { code: 'VCA', iata: 'VCA', icao: 'VVCT', nameVi: 'Sân bay Quốc tế Cần Thơ', nameEn: 'Can Tho International Airport', cityVi: 'Cần Thơ', cityEn: 'Can Tho', provinceVi: 'Cần Thơ', provinceEn: 'Can Tho', lat: 10.0851, lng: 105.7117, elevation: 2, isHub: false, type: 'international' },
    { code: 'HPH', iata: 'HPH', icao: 'VVCI', nameVi: 'Sân bay Quốc tế Cát Bi', nameEn: 'Cat Bi International Airport', cityVi: 'Hải Phòng', cityEn: 'Hai Phong', provinceVi: 'Hải Phòng', provinceEn: 'Hai Phong', lat: 20.8195, lng: 106.7249, elevation: 2, isHub: false, type: 'international' },
    { code: 'VII', iata: 'VII', icao: 'VVVH', nameVi: 'Sân bay Vinh', nameEn: 'Vinh Airport', cityVi: 'Vinh', cityEn: 'Vinh', provinceVi: 'Nghệ An', provinceEn: 'Nghe An', lat: 18.7376, lng: 105.6708, elevation: 6, isHub: false, type: 'domestic' },
    { code: 'HUI', iata: 'HUI', icao: 'VVPB', nameVi: 'Sân bay Phú Bài', nameEn: 'Phu Bai International Airport', cityVi: 'Huế', cityEn: 'Hue', provinceVi: 'Thừa Thiên Huế', provinceEn: 'Thua Thien Hue', lat: 16.4015, lng: 107.7025, elevation: 15, isHub: false, type: 'international' },
    
    // Central Highlands & South Central Coast
    { code: 'BMV', iata: 'BMV', icao: 'VVBM', nameVi: 'Sân bay Buôn Ma Thuột', nameEn: 'Buon Ma Thuot Airport', cityVi: 'Buôn Ma Thuột', cityEn: 'Buon Ma Thuot', provinceVi: 'Đắk Lắk', provinceEn: 'Dak Lak', lat: 12.6683, lng: 108.1203, elevation: 536, isHub: false, type: 'domestic' },
    { code: 'UIH', iata: 'UIH', icao: 'VVPC', nameVi: 'Sân bay Phù Cát', nameEn: 'Phu Cat Airport', cityVi: 'Quy Nhơn', cityEn: 'Quy Nhon', provinceVi: 'Bình Định', provinceEn: 'Binh Dinh', lat: 13.9550, lng: 109.0423, elevation: 20, isHub: false, type: 'domestic' },
    { code: 'TBB', iata: 'TBB', icao: 'VVTH', nameVi: 'Sân bay Đồng Hới', nameEn: 'Dong Hoi Airport', cityVi: 'Đồng Hới', cityEn: 'Dong Hoi', provinceVi: 'Quảng Bình', provinceEn: 'Quang Binh', lat: 17.5150, lng: 106.5898, elevation: 23, isHub: false, type: 'domestic' },
    { code: 'VCL', iata: 'VCL', icao: 'VVCA', nameVi: 'Sân bay Chu Lai', nameEn: 'Chu Lai Airport', cityVi: 'Tam Kỳ', cityEn: 'Tam Ky', provinceVi: 'Quảng Nam', provinceEn: 'Quang Nam', lat: 15.4053, lng: 108.7064, elevation: 10, isHub: false, type: 'domestic' },
    
    // Mekong Delta & Southwest
    { code: 'VKG', iata: 'VKG', icao: 'VVRG', nameVi: 'Sân bay Rạch Giá', nameEn: 'Rach Gia Airport', cityVi: 'Rạch Giá', cityEn: 'Rach Gia', provinceVi: 'Kiên Giang', provinceEn: 'Kien Giang', lat: 9.9581, lng: 105.1330, elevation: 2, isHub: false, type: 'domestic' },
    { code: 'CAH', iata: 'CAH', icao: 'VVCM', nameVi: 'Sân bay Cà Mau', nameEn: 'Ca Mau Airport', cityVi: 'Cà Mau', cityEn: 'Ca Mau', provinceVi: 'Cà Mau', provinceEn: 'Ca Mau', lat: 9.1778, lng: 105.1778, elevation: 2, isHub: false, type: 'domestic' },
    
    // North & Northwest
    { code: 'DIN', iata: 'DIN', icao: 'VVDB', nameVi: 'Sân bay Điện Biên Phủ', nameEn: 'Dien Bien Phu Airport', cityVi: 'Điện Biên Phủ', cityEn: 'Dien Bien Phu', provinceVi: 'Điện Biên', provinceEn: 'Dien Bien', lat: 21.3975, lng: 103.0078, elevation: 497, isHub: false, type: 'domestic' },
    { code: 'THD', iata: 'THD', icao: 'VVTX', nameVi: 'Sân bay Thọ Xuân', nameEn: 'Tho Xuan Airport', cityVi: 'Thanh Hóa', cityEn: 'Thanh Hoa', provinceVi: 'Thanh Hóa', provinceEn: 'Thanh Hoa', lat: 19.9017, lng: 105.4678, elevation: 16, isHub: false, type: 'domestic' },
    
    // Island Destinations
    { code: 'VCS', iata: 'VCS', icao: 'VVCS', nameVi: 'Sân bay Côn Đảo', nameEn: 'Con Dao Airport', cityVi: 'Côn Đảo', cityEn: 'Con Dao', provinceVi: 'Bà Rịa - Vũng Tàu', provinceEn: 'Ba Ria - Vung Tau', lat: 8.7318, lng: 106.6328, elevation: 2, isHub: false, type: 'domestic' }
  ];

  // Create airports with proper structure
  airportData.forEach((data, index) => {
    airports.push({
      code: {
        iata: data.iata,
        icao: data.icao
      },
      name: {
        vi: data.nameVi,
        en: data.nameEn
      },
      location: {
        city: {
          vi: data.cityVi,
          en: data.cityEn
        },
        province: {
          vi: data.provinceVi || data.cityVi,
          en: data.provinceEn || data.cityEn
        },
        country: {
          vi: 'Việt Nam',
          en: 'Vietnam',
          code: 'VN'
        },
        coordinates: {
          type: 'Point',
          coordinates: [data.lng, data.lat] // [longitude, latitude] format for GeoJSON
        },
        elevation: data.elevation || 10
      },
      operational: {
        timezone: 'Asia/Ho_Chi_Minh',
        operatingHours: {
          domestic: { 
            open: data.type === 'international' ? '05:00' : '06:00', 
            close: data.type === 'international' ? '23:00' : '22:00' 
          },
          international: { 
            open: '04:00', 
            close: '24:00' 
          }
        },
        runways: [{
          name: `${data.code}-01/19`,
          length: data.isHub ? 3800 : 3000 + index * 50,
          width: data.isHub ? 60 : 45,
          surface: 'Asphalt',
          heading: '01/19'
        }],
        capacity: {
          peakHourly: data.isHub ? 50 : 20 + index * 3,
          dailyMax: data.isHub ? 600 : 250 + index * 20
        }
      },
      infrastructure: {
        terminals: [{
          name: data.type === 'international' ? 'International Terminal' : 'Terminal 1',
          code: 'T1',
          gates: Array.from({length: data.isHub ? 20 : 10}, (_, i) => ({
            number: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`,
            type: data.type === 'international' ? (i < 5 ? 'domestic' : 'international') : 'domestic',
            aircraftCapacity: data.isHub ? 'Large' : 'Medium',
            facilities: ['boarding_bridge', 'ground_power', 'air_conditioning']
          })),
          facilities: {
            restaurants: [`Coffee Shop ${index + 1}`, `Restaurant ${index + 1}`],
            shops: [`Duty Free ${index + 1}`, `Convenience Store ${index + 1}`],
            lounges: data.isHub ? [`VIP Lounge ${index + 1}`, 'Business Lounge'] : [`VIP Lounge ${index + 1}`],
            services: ['WiFi', 'ATM', 'Currency Exchange', 'Medical Center', 'Prayer Room']
          },
          checkInCounters: {
            economy: Array.from({length: data.isHub ? 30 : 15}, (_, i) => `${i + 1}`),
            business: Array.from({length: data.isHub ? 10 : 5}, (_, i) => `B${i + 1}`),
            online: Array.from({length: data.isHub ? 20 : 10}, (_, i) => `K${i + 1}`)
          }
        }],
        parkingSpaces: {
          shortTerm: data.isHub ? 500 : 200,
          longTerm: data.isHub ? 1000 : 400,
          premium: data.isHub ? 100 : 50
        },
        transportation: {
          bus: true,
          taxi: true,
          metro: data.isHub,
          train: data.code === 'HAN' || data.code === 'SGN',
          shuttle: true
        }
      },
      services: {
        checkinServices: {
          online: true,
          kiosk: true,
          counter: true,
          curbside: data.isHub
        },
        baggageServices: {
          storage: true,
          wrapping: true,
          delivery: data.isHub
        },
        passengerServices: {
          wifi: true,
          chargingStations: true,
          nursery: data.isHub,
          prayerRoom: true,
          medicalCenter: data.isHub || data.type === 'international',
          lostAndFound: true
        },
        specialServices: {
          vipLounge: true,
          meetAndGreet: data.type === 'international',
          wheelchairAssist: true,
          unaccompaniedMinor: true
        }
      },
      vietjetInfo: {
        isHub: data.isHub,
        isFocus: data.type === 'international',
        checkInCounters: [`VJ-${index + 1}-01`, `VJ-${index + 1}-02`, `VJ-${index + 1}-03`],
        gates: [`A${index + 1}`, `B${index + 1}`],
        loungeAccess: data.isHub,
        groundHandling: data.isHub ? 'SASCO' : 'Local Ground Services',
        fuelProvider: 'Petrolimex Aviation'
      },
      commercial: {
        passengerTraffic: {
          annual: data.isHub ? 40000000 : 500000 + index * 200000,
          domestic: data.isHub ? 30000000 : 400000 + index * 150000,
          international: data.type === 'international' ? (data.isHub ? 10000000 : 100000 + index * 50000) : 0
        },
        popularDestinations: [],
        seasonality: {
          peakMonths: data.cityEn.includes('Nha Trang') || data.cityEn.includes('Phu Quoc') || data.cityEn.includes('Da Lat') ? [6, 7, 8, 12, 1] : [4, 5, 9, 10],
          lowMonths: [3, 11]
        }
      },
      contact: {
        phone: `+84-${28 + index}-${3800 + index}000`,
        email: `info@${data.code.toLowerCase()}-airport.vn`,
        website: `https://www.${data.code.toLowerCase()}-airport.vn`,
        socialMedia: {
          facebook: `facebook.com/${data.code.toLowerCase()}airport`,
          twitter: `@${data.code}Airport`,
          instagram: `${data.code.toLowerCase()}_airport`
        }
      },
      status: {
        isActive: true,
        isOperational: true,
        restrictions: [],
        notes: `Operational ${data.type} airport serving ${data.cityEn}`
      }
    });
  });

  return { airports };
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vietjet_clone', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Airport.deleteMany({}),
      Flight.deleteMany({}),
      User.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Fare.deleteMany({}),
      Route.deleteMany({}),
      Aircraft.deleteMany({}),
      Airline.deleteMany({}),
      Crew.deleteMany({}),
      Service.deleteMany({}),
      Schedule.deleteMany({}),
      Inventory.deleteMany({}),
      Promotion.deleteMany({})
    ]);
    console.log('✅ Cleared existing data');

    // Get sample data
    const { airports } = createSampleData();

    // 1. Insert Airports first (needed for airlines)
    console.log('🛫 Creating airports...');
    const insertedAirports = await Airport.insertMany(airports);
    console.log(`✅ Created ${insertedAirports.length} airports`);

    // 2. Insert Airlines
    console.log('🏢 Creating airlines...');
    const airlines = [];
    const airlineData = [
      { iata: 'VJ', icao: 'VJC', name: 'VietJet Air', fullName: 'Công ty Cổ phần Hàng không VietJet' },
      { iata: 'VN', icao: 'HVN', name: 'Vietnam Airlines', fullName: 'Tổng công ty Hàng không Việt Nam' },
      { iata: 'BL', icao: 'JEC', name: 'Jetstar Pacific', fullName: 'Công ty TNHH Hàng không Jetstar Pacific' },
      { iata: 'VU', icao: 'VAB', name: 'Vietravel Airlines', fullName: 'Công ty Cổ phần Hàng không Vietravel' },
      { iata: 'QH', icao: 'BAV', name: 'Bamboo Airways', fullName: 'Công ty Cổ phần Hàng không Tre Việt' }
    ];

    for (let i = 0; i < 10; i++) {
      const baseData = airlineData[i % airlineData.length];
      // Tạo mã IATA (2 ký tự) và ICAO (3 ký tự) duy nhất
      let uniqueIata, uniqueIcao;
      
      if (i < airlineData.length) {
        // Sử dụng mã gốc cho 5 airline đầu tiên
        uniqueIata = baseData.iata;
        uniqueIcao = baseData.icao;
      } else {
        // Tạo mã mới cho 5 airline còn lại
        const suffix = (i - airlineData.length + 1).toString(); // 1, 2, 3, 4, 5
        uniqueIata = `${baseData.iata.charAt(0)}${suffix}`; // VJ -> V1, V2, V3, V4, V5
        uniqueIcao = `${baseData.icao.substring(0, 2)}${suffix}`; // VJC -> VJ1, VJ2, VJ3, VJ4, VJ5
      }
      
      airlines.push({
        code: {
          iata: uniqueIata,
          icao: uniqueIcao,
          numeric: `${100 + i}`.padStart(3, '0')
        },
        name: {
          full: {
            vi: baseData.fullName,
            en: baseData.name
          },
          short: {
            vi: baseData.name,
            en: baseData.name
          },
          brand: baseData.name
        },
        company: {
          legalName: baseData.fullName,
          headquarter: {
            address: `123 Airline Street ${i + 1}`,
            city: i % 2 === 0 ? 'Ho Chi Minh City' : 'Hanoi',
            country: 'Vietnam'
          },
          founded: new Date(2000 + i, 0, 1),
          ceo: `CEO ${i + 1}`,
          employees: 1000 + i * 100,
          website: `https://${baseData.name.toLowerCase().replace(/\s+/g, '')}-${i}.com`,
          contact: {
            phone: `+84-28-123-${1000 + i}`,
            email: `info@${baseData.name.toLowerCase().replace(/\s+/g, '')}-${i}.com`,
            customerService: {
              hotline: `1900-${1000 + i}`,
              email: `support@${baseData.name.toLowerCase().replace(/\s+/g, '')}-${i}.com`,
              hours: '24/7'
            }
          }
        },
        operational: {
          homeBase: insertedAirports[i % 2]._id, // SGN or HAN
          hubs: [{
            airport: insertedAirports[i % insertedAirports.length]._id,
            type: i % 3 === 0 ? 'primary' : 'secondary'
          }],
          destinations: {
            domestic: 10 + i,
            international: 5 + i,
            total: 15 + i * 2
          },
          fleet: {
            total: 20 + i * 5,
            aircraftTypes: [
              { model: 'Airbus A320', count: 10 + i, averageAge: 5 + i },
              { model: 'Airbus A321', count: 5 + i, averageAge: 3 + i }
            ]
          }
        },
        financial: {
          revenue: {
            annual: 1000000000 + i * 100000000,
            currency: 'VND'
          },
          marketShare: {
            domestic: 10 + i * 2,
            international: 5 + i
          },
          stockSymbol: i < 3 ? `${baseData.iata}${i + 1}` : null
        },
        certifications: {
          safety: [{
            organization: 'IOSA',
            rating: `${2020 + i}`,
            validUntil: new Date(2025 + i, 11, 31)
          }],
          quality: [{
            award: 'Best Airline Award',
            year: 2023 + i,
            organization: 'Aviation Awards'
          }],
          environmental: ['ISO 14001', 'Carbon Neutral']
        },
        branding: {
          logo: {
            primary: `${baseData.name.toLowerCase().replace(' ', '')}-logo.png`,
            variations: [`${baseData.name.toLowerCase().replace(' ', '')}-white.png`]
          },
          colors: {
            primary: i % 2 === 0 ? '#FF6600' : '#0066CC',
            secondary: '#FFFFFF',
            accent: '#FFD700'
          },
          slogan: {
            vi: `Khẩu hiệu ${baseData.name}`,
            en: `${baseData.name} Slogan`
          }
        },
        status: {
          isActive: true,
          operationalStatus: 'operational',
          licenseStatus: 'valid',
          licenseExpiry: new Date(2025 + i, 11, 31)
        },
        metadata: {
          lastUpdated: new Date(),
          updatedBy: 'system',
          dataSource: 'seed',
          verified: true
        }
      });
    }
    const insertedAirlines = await Airline.insertMany(airlines);
    console.log(`✅ Created ${insertedAirlines.length} airlines`);

    // 3. Insert Aircraft
    console.log('✈️  Creating aircraft...');
    const aircraft = [];
    const aircraftTypes = ['Airbus A320', 'Airbus A321', 'Boeing 737', 'Boeing 787', 'ATR 72'];
    
    for (let i = 0; i < 10; i++) {
      const aircraftType = aircraftTypes[i % aircraftTypes.length];
      aircraft.push({
        registration: `VN-A${(100 + i).toString().padStart(3, '0')}`,
        aircraft: {
          manufacturer: aircraftType.split(' ')[0],
          model: aircraftType,
          series: aircraftType.includes('A320') ? '320' : aircraftType.includes('A321') ? '321' : '800',
          variant: 'Standard',
          msn: `MSN-${10000 + i}`
        },
        ownership: {
          airline: insertedAirlines[i % insertedAirlines.length]._id,
          owner: i % 3 === 0 ? 'owned' : 'leased',
          lessor: i % 3 === 0 ? null : `Lessor Company ${i}`,
          leaseStartDate: i % 3 === 0 ? null : new Date(2020 + i % 5, 0, 1)
        },
        specifications: {
          engines: `CFM56-5B${4 + i % 3}`,
          engineCount: 2,
          maxSeats: 180 + i * 10,
          mtow: 78000 + i * 200,
          range: 3000 + i * 50,
          serviceSpeed: 450 + i * 5,
          serviceCeiling: 39000 + i * 100,
          fuelCapacity: 24210 + i * 100
        },
        configuration: {
          layout: aircraftType.includes('A320') ? '3-3' : '3-3',
          totalSeats: 180 + i * 10,
          classes: [
            {
              class: 'economy',
              rows: 30 + i,
              seatsPerRow: 6,
              pitch: 28 + i,
              width: 17.5 + i * 0.1,
              features: ['reclining_seat', 'tray_table']
            },
            {
              class: 'business',
              rows: 4,
              seatsPerRow: 4,
              pitch: 36 + i,
              width: 21 + i * 0.1,
              features: ['lie_flat', 'power_outlet', 'premium_meal']
            }
          ],
          exitRows: [12, 13],
          galley: ['front', 'rear'],
          lavatory: ['front', 'middle', 'rear']
        },
        operational: {
          status: 'active',
          currentLocation: insertedAirports[i % insertedAirports.length]._id,
          homeBase: insertedAirports[0]._id,
          lastFlight: {
            flightNumber: `VJ${100 + i}`,
            date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
            from: insertedAirports[i % insertedAirports.length]._id,
            to: insertedAirports[(i + 1) % insertedAirports.length]._id
          },
          nextFlight: {
            flightNumber: `VJ${200 + i}`,
            scheduledDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            from: insertedAirports[i % insertedAirports.length]._id,
            to: insertedAirports[(i + 1) % insertedAirports.length]._id
          }
        },
        maintenance: {
          totalFlightHours: 10000 + i * 1000,
          totalCycles: 8000 + i * 800,
          lastMaintenance: {
            type: 'A-check',
            date: new Date(Date.now() - (30 + i) * 24 * 60 * 60 * 1000),
            location: 'SGN Maintenance Base',
            duration: 8,
            cost: 50000000 + i * 5000000,
            description: `Routine A-check maintenance for aircraft ${i + 1}`,
            technician: `Tech Team ${i + 1}`,
            status: 'completed'
          },
          nextMaintenance: {
            type: 'A-check',
            scheduledDate: new Date(Date.now() + (100 - i) * 24 * 60 * 60 * 1000),
            location: 'SGN Maintenance Base',
            estimatedDuration: 8,
            estimatedCost: 55000000 + i * 5000000
          },
          history: [{
            type: 'A-check',
            scheduledDate: new Date(Date.now() - (30 + i) * 24 * 60 * 60 * 1000),
            completedDate: new Date(Date.now() - (30 + i) * 24 * 60 * 60 * 1000),
            location: 'SGN Maintenance Base',
            duration: 8,
            cost: 50000000 + i * 5000000,
            description: `Routine A-check maintenance`,
            technician: `Tech Team ${i + 1}`,
            status: 'completed'
          }]
        },
        certifications: {
          airworthiness: {
            certificate: `AWC-${i + 1}`,
            issuedDate: new Date(2020 + i % 5, 0, 1),
            expiryDate: new Date(2025 + i % 5, 0, 1),
            issuedBy: 'CAAV',
            status: 'valid'
          },
          registration: {
            certificate: `RC-${i + 1}`,
            issuedDate: new Date(2020 + i % 5, 0, 1),
            expiryDate: new Date(2030 + i % 5, 0, 1),
            issuedBy: 'CAAV'
          }
        },
        insurance: {
          provider: `Insurance Company ${i + 1}`,
          policyNumber: `POL-${(1000000 + i).toString()}`,
          coverage: {
            hull: 50000000000 + i * 5000000000,
            liability: 100000000000 + i * 10000000000,
            passengerLiability: 1000000000 + i * 100000000
          },
          premium: 500000000 + i * 50000000,
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2025, 0, 1)
        },
        documents: {
          manuals: [`Flight Manual ${i + 1}`, `Maintenance Manual ${i + 1}`],
          certificates: [`Certificate ${i + 1}A`, `Certificate ${i + 1}B`],
          logBooks: [`Flight Log ${i + 1}`, `Maintenance Log ${i + 1}`],
          inspectionReports: [`Inspection Report ${i + 1}`]
        },
        financials: {
          purchasePrice: 5000000000 + i * 500000000,
          currentValue: 4000000000 + i * 400000000,
          depreciationRate: 5 + i * 0.5,
          operatingCostPerHour: 50000 + i * 5000,
          maintenanceCostPerHour: 20000 + i * 2000
        }
      });
    }
    const insertedAircraft = await Aircraft.insertMany(aircraft);
    console.log(`✅ Created ${insertedAircraft.length} aircraft`);

    // 4. Insert Routes
    console.log('🛣️  Creating routes...');
    const routes = [];
    for (let i = 0; i < 10; i++) {
      const originIndex = i % insertedAirports.length;
      const destIndex = (i + 1) % insertedAirports.length;
      
      routes.push({
        code: `RT${(100 + i).toString().padStart(3, '0')}`,
        origin: insertedAirports[originIndex]._id,
        destination: insertedAirports[destIndex]._id,
        airline: insertedAirlines[i % insertedAirlines.length]._id,
        type: i % 3 === 0 ? 'international' : 'domestic',
        distance: {
          nauticalMiles: 500 + i * 50,
          kilometers: 926 + i * 93
        },
        duration: {
          scheduled: 90 + i * 10,
          minimum: 80 + i * 10,
          maximum: 120 + i * 10,
          average: 95 + i * 10
        },
        operational: {
          frequency: {
            daily: 2 + i % 4,
            weekly: 14 + i % 10,
            monthly: 60 + i * 5,
            seasonal: i % 3 === 0
          },
          schedule: {
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            timeSlots: [
              { departure: '06:00', arrival: '08:30', frequency: 'daily' },
              { departure: '14:00', arrival: '16:30', frequency: 'daily' }
            ]
          },
          aircraft: [{
            type: insertedAircraft[i % insertedAircraft.length]._id,
            usage: 80 + i * 2
          }],
          capacity: {
            daily: {
              passengers: 180 + i * 20,
              cargo: 1000 + i * 100
            },
            peak: {
              passengers: 200 + i * 25,
              cargo: 1200 + i * 120
            }
          }
        },
        services: {
          available: {
            meals: true,
            entertainment: i % 2 === 0,
            wifi: i % 3 === 0,
            lounges: i < 3
          },
          ground: {
            fastTrack: i < 5,
            meetAndGreet: i < 3,
            vipServices: i < 2
          },
          cargo: {
            available: true,
            specialHandling: ['dangerous_goods', 'live_animals'],
            restrictions: ['lithium_batteries']
          }
        },
        performance: {
          onTimePerformance: {
            percentage: 85 + i * 2,
            benchmark: 90
          },
          loadFactor: {
            average: 75 + i * 3,
            target: 85,
            breakeven: 70
          },
          revenue: {
            perSeat: 800000 + i * 100000,
            perKm: 1000 + i * 100,
            yield: 0.15 + i * 0.01
          },
          costs: {
            fuel: 300000 + i * 30000,
            crew: 150000 + i * 15000,
            maintenance: 100000 + i * 10000,
            airport: 200000 + i * 20000,
            other: 50000 + i * 5000
          }
        },
        history: {
          launched: new Date(2020 + i % 5, i % 12, 1),
          milestones: [{
            date: new Date(2020 + i % 5, i % 12, 1),
            event: 'Route Launch',
            description: `Launch of route ${i + 1}`
          }]
        },
        partnerships: {
          codeshare: [],
          interline: []
        },
        status: {
          operational: 'active',
          approval: 'approved',
          effectiveFrom: new Date(2024, 0, 1),
          effectiveTo: new Date(2025, 11, 31),
          notes: `Route ${i + 1} operational notes`
        },
        metadata: {
          created: {
            date: new Date(),
            by: 'system'
          },
          lastUpdated: {
            date: new Date(),
            by: 'system'
          },
          dataSource: 'seed_script',
          verified: true
        }
      });
    }
    const insertedRoutes = await Route.insertMany(routes);
    console.log(`✅ Created ${insertedRoutes.length} routes`);

    // 5. Insert Users (both regular and guest users)
    console.log('👥 Creating users...');
    const users = [];
    const titles = ['Mr', 'Ms', 'Mrs', 'Dr'];
    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
    const lastNames = ['Văn A', 'Thị B', 'Văn C', 'Thị D', 'Văn E', 'Thị F', 'Văn G', 'Thị H', 'Văn I', 'Thị J'];

    for (let i = 0; i < 10; i++) {
      const isGuest = i >= 7; // Last 3 users are guests
      
      users.push({
        personalInfo: {
          title: titles[i % titles.length],
          firstName: firstNames[i % firstNames.length],
          lastName: lastNames[i % lastNames.length],
          dateOfBirth: new Date(1980 + i, i % 12, (i % 28) + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          nationality: 'Vietnam'
        },
        contactInfo: {
          email: isGuest ? `guest${i}@example.com` : `user${i}@vietjet.com`,
          phone: `090${(1234567 + i).toString().slice(0, 7)}`,
          address: {
            street: `${123 + i} Nguyen Hue Street`,
            ward: `Ward ${i + 1}`,
            district: `District ${(i % 12) + 1}`,
            city: i % 2 === 0 ? 'Ho Chi Minh City' : 'Hanoi',
            province: i % 2 === 0 ? 'Ho Chi Minh' : 'Hanoi',
            country: 'Vietnam',
            zipCode: `${700000 + i * 1000}`
          }
        },
        account: {
          password: isGuest ? undefined : 'password123',
          isEmailVerified: !isGuest,
          loginAttempts: 0
        },
        isGuest: isGuest,
        guestInfo: isGuest ? {
          temporaryToken: `temp-token-${i}`,
          tokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBookings: []
        } : undefined,
        frequentFlyerInfo: isGuest ? undefined : {
          membershipNumber: `VJ${(1000000 + i).toString()}`,
          membershipLevel: ['bronze', 'silver', 'gold', 'platinum'][i % 4],
          totalMiles: i * 1000,
          totalFlights: i * 2
        },
        documents: isGuest ? [] : [{
          type: 'passport',
          number: `P${(123456789 + i).toString()}`,
          expiryDate: new Date(2030, 11, 31),
          issuedCountry: 'Vietnam',
          isPrimary: true
        }],
        preferences: {
          language: 'vi',
          currency: 'VND',
          seatPreference: ['window', 'aisle', 'middle'][i % 3],
          mealPreference: ['normal', 'vegetarian', 'vegan'][i % 3]
        },
        status: 'active'
      });
    }
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Created ${insertedUsers.length} users (${insertedUsers.filter(u => u.isGuest).length} guests)`);

    // 6. Insert Fares
    console.log('💰 Creating fares...');
    const fares = [];
    for (let i = 0; i < 10; i++) {
      const baseAmount = 500000 + i * 100000;
      const totalAmount = baseAmount + 50000 + i * 5000 + 100000 + i * 10000;
      
      fares.push({
        code: `FARE${(100 + i).toString().padStart(3, '0')}`,
        name: {
          vi: `Giá vé ${i + 1}`,
          en: `Fare ${i + 1}`
        },
        route: insertedRoutes[i % insertedRoutes.length]._id,
        airline: insertedAirlines[i % insertedAirlines.length]._id,
        type: ['published', 'private', 'promotional'][i % 3],
        cabinClass: ['economy', 'business'][i % 2],
        tripType: ['one_way', 'round_trip'][i % 2],
        pricing: {
          baseFare: {
            amount: baseAmount,
            currency: 'VND'
          },
          fees: {
            taxes: [{
              code: 'VAT',
              description: 'Value Added Tax',
              amount: 50000 + i * 5000
            }],
            surcharges: [],
            serviceFees: []
          },
          total: totalAmount,
          ageBasedPricing: {
            adult: totalAmount,
            child: Math.round(totalAmount * 0.75),
            infant: Math.round(totalAmount * 0.1)
          },
          dynamic: {
            enabled: true,
            factors: [{
              factor: 'demand',
              weight: 0.3,
              multiplier: 1.0 + i * 0.1
            }],
            priceRange: {
              minimum: totalAmount * 0.8,
              maximum: totalAmount * 1.5
            }
          }
        },
        bookingClasses: [
          { code: 'Y', availability: 9, price: totalAmount, sold: 0 },
          { code: 'M', availability: 5, price: totalAmount + 100000, sold: 0 }
        ],
        validity: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2025, 11, 31),
          salesPeriod: {
            startDate: new Date(2024, 0, 1),
            endDate: new Date(2025, 11, 31)
          },
          travelPeriod: {
            startDate: new Date(2024, 0, 1),
            endDate: new Date(2025, 11, 31),
            blackoutDates: [],
            validDays: [0, 1, 2, 3, 4, 5, 6]
          }
        },
        conditions: {
          booking: {
            advancePurchase: {
              minimum: 0,
              maximum: 365
            },
            lastBookingTime: 2
          },
          stay: {
            minimumStay: {
              nights: 0,
              includeSaturday: false,
              includeSunday: false
            },
            maximumStay: {
              months: 12,
              days: 365
            }
          },
          passenger: {
            minAge: 0,
            maxAge: 120,
            residency: ['VN'],
            accompaniedBy: null
          },
          routing: {
            directOnly: i % 2 === 0,
            maxConnections: i % 2 === 0 ? 0 : 2,
            allowedStopover: [],
            forbiddenStopover: []
          }
        },
        rules: {
          cancellation: {
            allowed: true,
            timeLimit: {
              hours: 24,
              beforeDeparture: true
            },
            penalty: {
              amount: 200000 + i * 20000,
              percentage: null,
              minimum: 100000
            }
          },
          change: {
            allowed: true,
            timeLimit: {
              hours: 2,
              beforeDeparture: true
            },
            penalty: {
              amount: 300000 + i * 30000,
              percentage: null,
              minimum: 150000
            }
          },
          refund: {
            allowed: true,
            conditions: ['unused_ticket'],
            penalty: {
              amount: 250000 + i * 25000,
              percentage: null,
              minimum: 200000
            }
          }
        },
        availability: {
          total: 100 + i * 10,
          sold: i * 5,
          blocked: i * 2,
          available: (100 + i * 10) - (i * 5) - (i * 2)
        },
        status: {
          isActive: true,
          publishedAt: new Date(2024, 0, 1),
          lastUpdated: new Date()
        }
      });
    }
    const insertedFares = await Fare.insertMany(fares);
    console.log(`✅ Created ${insertedFares.length} fares`);

    // 7. Insert Flights
    console.log('✈️  Creating flights...');
    const flights = [];
    const today = new Date();
    
    // Generate 10 flights for the next few days
    for (let i = 0; i < 10; i++) {
      const flightDate = new Date(today);
      flightDate.setDate(today.getDate() + (i % 7)); // Spread over a week
      
      const originAirport = insertedAirports[i % insertedAirports.length];
      const destAirport = insertedAirports[(i + 1) % insertedAirports.length];
      
      flights.push({
        flightNumber: `VJ${(100 + i).toString().padStart(3, '0')}`,
        airline: {
          code: insertedAirlines[i % insertedAirlines.length].code.iata,
          name: insertedAirlines[i % insertedAirlines.length].name.short.en,
          logo: `logo-${i + 1}.png`
        },
        route: {
          departure: {
            airport: originAirport._id,
            time: new Date(flightDate.setHours(6 + (i % 18), 30, 0, 0)),
            terminal: 'T1',
            gate: `A${i + 1}`,
            scheduledTime: new Date(flightDate.setHours(6 + (i % 18), 30, 0, 0)),
            estimatedTime: new Date(flightDate.setHours(6 + (i % 18), 30, 0, 0))
          },
          arrival: {
            airport: destAirport._id,
            time: new Date(flightDate.setHours(8 + (i % 18), 45, 0, 0)),
            terminal: 'T1',
            gate: `B${i + 1}`,
            scheduledTime: new Date(flightDate.setHours(8 + (i % 18), 45, 0, 0)),
            estimatedTime: new Date(flightDate.setHours(8 + (i % 18), 45, 0, 0))
          },
          distance: 500 + i * 100,
          duration: {
            scheduled: 135 + i * 10,
            actual: 135 + i * 10
          }
        },
        aircraft: {
          type: aircraftTypes[i % aircraftTypes.length],
          registration: insertedAircraft[i % insertedAircraft.length].registration,
          configuration: {
            economy: {
              rows: 30 + i,
              seatsPerRow: 6,
              totalSeats: 180 + i * 6
            },
            business: {
              rows: 4,
              seatsPerRow: 4,
              totalSeats: 16
            }
          }
        },
        pricing: {
          economy: {
            base: 800000 + i * 100000,
            saver: 699000 + i * 80000,
            classic: 800000 + i * 100000,
            flexible: 1000000 + i * 120000
          },
          business: {
            base: 2400000 + i * 200000,
            flexible: 2800000 + i * 250000
          }
        },
        seats: {
          economy: { 
            total: 180 + i * 6, 
            available: 180 + i * 6 - (i * 5), 
            blocked: i * 2 
          },
          premiumEconomy: { total: 0, available: 0, blocked: 0 },
          business: { 
            total: 16, 
            available: 16 - i, 
            blocked: 0 
          },
          first: { total: 0, available: 0, blocked: 0 }
        },
        seatMap: Array.from({length: 30 + i}, (_, rowIndex) => ({
          row: rowIndex + 1,
          seats: Array.from({length: 6}, (_, seatIndex) => ({
            seatNumber: `${rowIndex + 1}${String.fromCharCode(65 + seatIndex)}`,
            class: rowIndex < 4 ? 'business' : 'economy',
            type: seatIndex === 0 || seatIndex === 5 ? 'window' : seatIndex === 2 || seatIndex === 3 ? 'aisle' : 'middle',
            status: Math.random() > 0.8 ? 'occupied' : 'available',
            price: rowIndex < 10 ? 100000 : 0,
            features: rowIndex < 4 ? ['extra_legroom', 'power_outlet'] : []
          }))
        })),
        status: ['scheduled', 'boarding', 'delayed'][i % 3],
        delay: {
          departure: {
            minutes: i % 3 === 2 ? i * 10 : 0,
            reason: i % 3 === 2 ? 'weather' : null,
            category: i % 3 === 2 ? 'weather' : null
          },
          arrival: {
            minutes: i % 3 === 2 ? i * 10 : 0,
            reason: i % 3 === 2 ? 'weather' : null
          }
        },
        services: {
          meals: {
            available: true,
            types: []
          },
          baggage: {
            carryOn: {
              weight: 7,
              dimensions: '56x36x23cm'
            },
            checked: [
              { weight: 20, price: 0 },
              { weight: 30, price: 200000 + i * 20000 }
            ]
          },
          entertainment: {
            wifi: { available: i % 2 === 0, price: 100000 },
            ife: i % 3 === 0
          },
          specialServices: i % 2 === 0 ? ['wheelchair'] : []
        },
        frequency: {
          isRegular: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          seasonality: ['year_round', 'summer', 'winter'][i % 3],
          effectiveFrom: new Date(2024, 0, 1),
          effectiveTo: new Date(2025, 11, 31)
        },
        operational: {
          crew: {
            pilots: 2,
            flightAttendants: 4 + (i % 2),
            captain: `Captain ${i + 1}`,
            firstOfficer: `FO ${i + 1}`
          },
          fuel: {
            planned: 5000 + i * 200,
            unit: 'kg'
          }
        },
        metadata: {
          bookingClass: {
            economy: ['Y', 'M', 'B', 'H'],
            business: ['C', 'J', 'D']
          },
          isActive: 'active',
          notes: `Sample flight ${i + 1}`
        }
      });

    }
    
    const insertedFlights = await Flight.insertMany(flights);
    console.log(`✅ Created ${insertedFlights.length} flights`);

    // 7.5. Create Inventory for each Flight
    console.log('💺 Creating inventory for flights...');
    const inventories = [];
    for (const flight of insertedFlights) {
      // Get aircraft info from the flight object directly (it's embedded)
      const aircraftInfo = flight.aircraft;
      const aircraftReg = aircraftInfo.registration;
      
      // Find the actual aircraft document by registration
      const aircraftDoc = insertedAircraft.find(a => a.registration === aircraftReg);
      if (!aircraftDoc) {
        console.warn(`⚠️  Aircraft not found for registration: ${aircraftReg}`);
        continue;
      }
      
      // Calculate total seats from configuration
      const economySeats = aircraftInfo.configuration?.economy?.totalSeats || 150;
      const businessSeats = aircraftInfo.configuration?.business?.totalSeats || 20;
      const totalSeats = economySeats + businessSeats;
      
      // Generate seat map
      const seats = [];
      let seatNumber = 1;
      
      // Business class seats (first rows)
      const businessRows = Math.ceil(businessSeats / 4); // 4 seats per row for business
      for (let row = 1; row <= businessRows; row++) {
        for (const letter of ['A', 'C', 'D', 'F']) { // Business class: 2-2 configuration
          if (seatNumber > businessSeats) break;
          
          const seatType = ['A', 'F'].includes(letter) ? 'window' : 'aisle';
          
          seats.push({
            seatNumber: `${row}${letter}`,
            class: 'business',
            type: seatType,
            status: 'available',
            price: 500000, // Phí chọn ghế business
            features: ['extra_legroom', 'priority_boarding', 'premium_meal'],
            restrictions: []
          });
          
          seatNumber++;
        }
      }
      
      // Economy class seats
      seatNumber = 1;
      const economyStartRow = businessRows + 1;
      const economyRows = Math.ceil(economySeats / 6); // 6 seats per row for economy
      
      for (let row = economyStartRow; row < economyStartRow + economyRows; row++) {
        for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) { // Economy: 3-3 configuration
          if (seatNumber > economySeats) break;
          
          const seatType = ['A', 'F'].includes(letter) ? 'window' : 
                          ['B', 'E'].includes(letter) ? 'middle' : 'aisle';
          
          seats.push({
            seatNumber: `${row}${letter}`,
            class: 'economy',
            type: seatType,
            status: 'available',
            price: 150000, // Phí chọn ghế economy
            features: [],
            restrictions: row === economyStartRow ? ['emergency_exit'] : []
          });
          
          seatNumber++;
        }
      }
      
      inventories.push({
        flight: flight._id,
        departureDate: flight.route.departure.time,
        route: {
          origin: flight.route.departure.airport,
          destination: flight.route.arrival.airport
        },
        aircraft: aircraftDoc._id,
        capacity: {
          total: totalSeats,
          byClass: {
            economy: {
              total: economySeats,
              available: economySeats,
              blocked: 0
            },
            premiumEconomy: {
              total: 0,
              available: 0,
              blocked: 0
            },
            business: {
              total: businessSeats,
              available: businessSeats,
              blocked: 0
            },
            first: {
              total: 0,
              available: 0,
              blocked: 0
            }
          }
        },
        seatMap: seats,
        bookingClasses: [
          {
            class: 'Y',
            name: 'Economy',
            category: 'economy',
            authorized: economySeats,
            sold: 0,
            available: economySeats,
            oversold: 0,
            waitlist: 0
          },
          {
            class: 'C',
            name: 'Business',
            category: 'business',
            authorized: businessSeats,
            sold: 0,
            available: businessSeats,
            oversold: 0,
            waitlist: 0
          }
        ],
        totals: {
          authorized: totalSeats,
          sold: 0,
          available: totalSeats,
          revenue: 0
        },
        lastUpdated: new Date()
      });
    }
    
    const insertedInventories = await Inventory.insertMany(inventories);
    console.log(`✅ Created ${insertedInventories.length} inventories`);

    // 8. Insert Bookings
    console.log('📖 Creating bookings...');
    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const user = insertedUsers[i % insertedUsers.length];
      const flight = insertedFlights[i % insertedFlights.length];
      
      bookings.push({
        bookingReference: `${String.fromCharCode(65 + i)}${String.fromCharCode(65 + (i + 1) % 26)}${(1000 + i).toString().slice(-4)}`,
        pnr: `${String.fromCharCode(65 + (i + 2) % 26)}${String.fromCharCode(65 + (i + 3) % 26)}${(2000 + i).toString().slice(-4)}`,
        user: user.isGuest ? null : user._id,
        flights: [{
          flight: flight._id,
          type: 'outbound',
          passengers: [{
            title: user.personalInfo.title,
            firstName: user.personalInfo.firstName,
            lastName: user.personalInfo.lastName,
            dateOfBirth: user.personalInfo.dateOfBirth,
            gender: user.personalInfo.gender,
            nationality: user.personalInfo.nationality,
            document: {
              type: 'passport',
              number: `P${(123456789 + i).toString()}`,
              expiryDate: new Date(2030, 11, 31),
              issuedCountry: 'Vietnam'
            },
            ticket: {
              seatClass: i % 2 === 0 ? 'economy' : 'business',
              seatNumber: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
              boardingGroup: ['A', 'B', 'C'][i % 3],
              ticketNumber: `VJ-${(1000000 + i).toString()}`,
              eTicketNumber: `E-${(2000000 + i).toString()}`
            },
            services: {
              baggage: {
                checkedWeight: 20 + (i % 3) * 10,
                additionalWeight: i % 2 === 0 ? 5 : 0,
                handCarryWeight: 7
              },
              meal: {
                type: ['normal', 'vegetarian', 'vegan'][i % 3]
              },
              seat: {
                preference: ['window', 'aisle', 'middle'][i % 3]
              }
            },
            checkIn: {
              isCheckedIn: i < 5,
              checkedInAt: i < 5 ? new Date(Date.now() - (24 - i) * 60 * 60 * 1000) : null,
              checkedInBy: i < 5 ? 'online' : null
            },
            passengerType: 'adult'
          }]
        }],
        contactInfo: {
          email: user.contactInfo.email,
          phone: user.contactInfo.phone,
          address: user.contactInfo.address
        },
        payment: {
          totalAmount: (i % 2 === 0 ? 800000 : 2400000) + i * 100000,
          currency: 'VND',
          breakdown: {
            baseFare: (i % 2 === 0 ? 650000 : 2000000) + i * 80000,
            taxes: 100000 + i * 10000,
            fees: 50000 + i * 5000,
            services: i * 5000,
            discount: i % 3 === 0 ? 100000 : 0
          },
          method: ['credit_card', 'bank_transfer', 'e_wallet'][i % 3],
          status: i < 8 ? 'paid' : 'pending',
          transactionId: `TXN-${(Date.now() + i).toString()}`,
          paymentGateway: ['vnpay', 'momo', 'zalopay'][i % 3],
          paidAt: i < 8 ? new Date(Date.now() - (i + 1) * 60 * 60 * 1000) : null
        },
        status: i < 8 ? 'confirmed' : 'pending',
        bookingSource: {
          channel: ['website', 'mobile_app', 'call_center'][i % 3],
          agent: i % 3 === 2 ? `Agent ${i + 1}` : null
        },
        metadata: {
          ipAddress: `192.168.1.${100 + i}`,
          sessionId: `session-${i + 1}`,
          loyaltyPointsEarned: Math.floor(((i % 2 === 0 ? 800000 : 2400000) + i * 100000) / 1000)
        },
        notifications: {
          bookingConfirmation: {
            sent: i < 8,
            sentAt: i < 8 ? new Date(Date.now() - (i + 1) * 60 * 60 * 1000) : null
          }
        }
      });
    }
    const insertedBookings = await Booking.insertMany(bookings);
    console.log(`✅ Created ${insertedBookings.length} bookings`);

    // 9. Insert Payments
    console.log('💳 Creating payments...');
    const payments = [];
    for (let i = 0; i < 10; i++) {
      payments.push({
        transactionId: `TXN-${(Date.now() + i * 1000).toString()}`,
        paymentReference: `PAY-${(Date.now() + i * 1000).toString().slice(-6)}`,
        booking: insertedBookings[i % insertedBookings.length]._id,
        user: insertedBookings[i % insertedBookings.length].user,
        amount: {
          subtotal: (800000 + i * 100000),
          taxes: 100000 + i * 10000,
          fees: 50000 + i * 5000,
          discount: i % 3 === 0 ? 100000 : 0,
          total: (950000 + i * 115000) - (i % 3 === 0 ? 100000 : 0),
          currency: 'VND'
        },
        paymentMethod: {
          type: ['credit_card', 'bank_transfer', 'e_wallet'][i % 3],
          card: i % 3 === 0 ? {
            last4Digits: `${(1234 + i).toString().slice(-4)}`,
            brand: ['visa', 'mastercard', 'jcb'][i % 3],
            type: 'credit',
            holderName: `NGUYEN VAN ${String.fromCharCode(65 + i)}`
          } : undefined,
          eWallet: i % 3 === 2 ? {
            provider: ['momo', 'zalopay', 'vnpay'][i % 3],
            accountId: `ewallet-${i + 1}`,
            transactionId: `ew-txn-${i + 1}`
          } : undefined
        },
        gateway: {
          provider: ['vnpay', 'momo', 'zalopay'][i % 3],
          transactionId: `gw-txn-${i + 1}`,
          referenceId: `ref-${i + 1}`,
          responseCode: i < 8 ? '00' : '01',
          responseMessage: i < 8 ? 'Success' : 'Pending'
        },
        status: {
          current: i < 8 ? 'completed' : 'pending',
          history: [{
            status: 'initiated',
            timestamp: new Date(Date.now() - (i + 2) * 60 * 60 * 1000),
            notes: 'Payment initiated'
          }, {
            status: i < 8 ? 'completed' : 'pending',
            timestamp: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),
            notes: i < 8 ? 'Payment completed successfully' : 'Payment pending'
          }]
        },
        security: {
          ipAddress: `192.168.1.${100 + i}`,
          userAgent: `Mozilla/5.0 (Browser ${i + 1})`,
          riskScore: Math.random() * 100,
          fraudFlags: []
        },
        metadata: {
          sessionId: `payment-session-${i + 1}`,
          channel: ['web', 'mobile', 'api'][i % 3],
          version: '1.0'
        },
        transactions: [{
          id: `txn-${Date.now()}-${i}`,
          gateway: {
            provider: ['vnpay', 'momo', 'zalopay'][i % 3],
            transactionId: `gw-txn-${i + 1}`,
            referenceId: `ref-${i + 1}`,
            responseCode: i < 8 ? '00' : '01',
            responseMessage: i < 8 ? 'Success' : 'Pending'
          },
          amount: (850000 + i * 115000) - (i % 3 === 0 ? 100000 : 0),
          currency: 'VND',
          status: i < 8 ? 'success' : 'pending',
          timestamp: {
            initiated: new Date(Date.now() - (i + 2) * 60 * 60 * 1000),
            completed: i < 8 ? new Date(Date.now() - (i + 1) * 60 * 60 * 1000) : undefined
          }
        }]
      });
    }
    const insertedPayments = await Payment.insertMany(payments);
    console.log(`✅ Created ${insertedPayments.length} payments`);

    // 10. Insert Services
    console.log('🛎️  Creating services...');
    const services = [];
    const serviceTypes = ['meal', 'baggage', 'seat', 'insurance', 'lounge'];
    
    for (let i = 0; i < 10; i++) {
      services.push({
        code: `SVC${(100 + i).toString().padStart(3, '0')}`,
        name: {
          vi: `Dịch vụ ${serviceTypes[i % serviceTypes.length]} ${i + 1}`,
          en: `${serviceTypes[i % serviceTypes.length]} Service ${i + 1}`
        },
        airline: insertedAirlines[i % insertedAirlines.length]._id,
        category: serviceTypes[i % serviceTypes.length],
        type: 'ancillary',
        description: {
          vi: `Mô tả dịch vụ ${serviceTypes[i % serviceTypes.length]} số ${i + 1}`,
          en: `Description for ${serviceTypes[i % serviceTypes.length]} service ${i + 1}`
        },
        pricing: {
          basePrice: 50000 + i * 25000,
          currency: 'VND',
          tiers: [{
            name: 'Standard',
            price: 50000 + i * 25000,
            features: [`Feature ${i + 1}A`, `Feature ${i + 1}B`]
          }, {
            name: 'Premium',
            price: (50000 + i * 25000) * 1.5,
            features: [`Feature ${i + 1}A`, `Feature ${i + 1}B`, `Feature ${i + 1}C`]
          }]
        },
        availability: {
          routes: [insertedRoutes[i % insertedRoutes.length]._id],
          aircraft: [insertedAircraft[i % insertedAircraft.length]._id],
          cabinClasses: i % 2 === 0 ? ['economy', 'business'] : ['business'],
          timeRestrictions: {
            bookingDeadline: 24,
            cancellationDeadline: 2
          }
        },
        terms: {
          refundable: i % 2 === 0,
          transferable: i % 3 === 0,
          modifiable: true,
          restrictions: [`Restriction ${i + 1}`]
        },
        status: {
          isActive: true,
          availableFrom: new Date(2024, 0, 1),
          availableUntil: new Date(2025, 11, 31)
        }
      });
    }
    const insertedServices = await Service.insertMany(services);
    console.log(`✅ Created ${insertedServices.length} services`);

    // 11. Insert Promotions
    console.log('🎁 Creating promotions...');
    const promotions = [];
    
    for (let i = 0; i < 10; i++) {
      promotions.push({
        code: `PROMO${(100 + i).toString().padStart(3, '0')}`,
        name: `Promotion ${i + 1}`,
        description: `Description for promotion ${i + 1}`,
        discountType: i % 2 === 0 ? 'percentage' : 'fixed_amount',
        discountValue: i % 2 === 0 ? 10 + i * 5 : 100000 + i * 50000,
        maxDiscount: i % 2 === 0 ? 500000 + i * 100000 : null,
        minSpend: 500000 + i * 100000,
        validity: {
          startDate: new Date(2024, i % 12, 1),
          endDate: new Date(2025, (i + 3) % 12, 28),
          travelPeriod: {
            from: new Date(2024, i % 12, 1),
            to: new Date(2025, (i + 6) % 12, 28)
          }
        },
        conditions: {
          userTypes: i % 3 === 0 ? ['new_user'] : ['existing_user'],
          routes: [insertedRoutes[i % insertedRoutes.length]._id],
          seatClasses: i % 2 === 0 ? ['economy'] : ['economy', 'business'],
          minPassengers: 1,
          maxPassengers: 9,
          advanceBooking: {
            minDays: i * 2,
            maxDays: i * 2 + 30
          },
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        },
        usage: {
          totalLimit: 100 + i * 50,
          perUserLimit: 1 + i % 3,
          totalUsed: i * 5,
          currentUsage: i * 2
        },
        marketing: {
          channels: ['email', 'sms', 'app'],
          targetAudience: ['frequent_flyer', 'new_customer'][i % 2],
          priority: i % 3 + 1
        },
        status: i < 8 ? 'active' : 'draft'
      });
    }
    const insertedPromotions = await Promotion.insertMany(promotions);
    console.log(`✅ Created ${insertedPromotions.length} promotions`);

    // Print summary
    console.log('\n🎉 === SEED DATA COMPLETED SUCCESSFULLY === 🎉');
    console.log('📊 Data Summary:');
    console.log(`   🏢 Airlines: ${insertedAirlines.length}`);
    console.log(`   🛫 Airports: ${insertedAirports.length}`);
    console.log(`   ✈️  Aircraft: ${insertedAircraft.length}`);
    console.log(`   🛣️  Routes: ${insertedRoutes.length}`);
    console.log(`   👥 Users: ${insertedUsers.length} (${insertedUsers.filter(u => u.isGuest).length} guests)`);
    console.log(`   💰 Fares: ${insertedFares.length}`);
    console.log(`   ✈️  Flights: ${insertedFlights.length}`);
    console.log(`   � Inventories: ${insertedInventories.length}`);
    console.log(`   �📖 Bookings: ${insertedBookings.length}`);
    console.log(`   💳 Payments: ${insertedPayments.length}`);
    console.log(`   🛎️  Services: ${insertedServices.length}`);
    console.log(`   🎁 Promotions: ${insertedPromotions.length}`);
    
    console.log('\n🔐 Sample Login Credentials:');
    console.log('   Regular Users:');
    console.log('   📧 Email: user0@vietjet.com');
    console.log('   🔑 Password: password123');
    console.log('   📧 Email: user1@vietjet.com');
    console.log('   🔑 Password: password123');
    
    console.log('\n   Guest Users:');
    console.log('   📧 Email: guest7@example.com');
    console.log('   📧 Email: guest8@example.com');
    console.log('   📧 Email: guest9@example.com');
    
    console.log('\n✈️  Sample Flight Routes:');
    insertedFlights.slice(0, 3).forEach((flight, index) => {
      console.log(`   ${flight.flightNumber}: ${flight.route.departure.airport} → ${flight.route.arrival.airport}`);
    });
    
    console.log('\n🚀 Ready to run: npm start');
    console.log('🌐 API will be available at: http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();