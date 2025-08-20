import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MapPin, User, Stethoscope, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Mail, Phone } from 'lucide-react';
import { useHeightReporting } from '@/hooks/useHeightReporting';

interface Location {
  id: string;
  name: string;
  location: string;
}

interface Personnel {
  id: string;
  name: string;
  role: string;
  description: string;
  expert: boolean;
  location_id: string;
  service_ids: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  time: number;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  therapist_link: string;
}

interface FormData {
  statements: string[];
  location: Location | null;
  date: string;
  time: string;
  therapist: Personnel | null;
  service: Service | null;
  personalData: {
    fullName: string;
    email: string;
    phone: string;
  };
}

const STATEMENTS = [
  "Szív problémám vagy pacemakerem van",
  "Nem rég műtöttek vagy csonkolásos műtéten estem át", 
  "Nyílt vagy fekélyes sebem van",
  "Sztómával rendelkezem",
  "Kiskorú gyerek kezelését igénylem",
  "A fentiek közül egyik sem érvényes rám nézve"
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

const STEPS = [
  { id: 1, title: "Nyilatkozat", icon: CheckCircle },
  { id: 2, title: "Helyszín", icon: MapPin },
  { id: 3, title: "Dátum", icon: Calendar },
  { id: 4, title: "Időpont", icon: Clock },
  { id: 5, title: "Terapeuta", icon: User },
  { id: 6, title: "Szolgáltatás", icon: Stethoscope },
  { id: 7, title: "Adatok", icon: CreditCard },
  { id: 8, title: "Összegzés", icon: CheckCircle }
];

export default function ReservationSystem() {
  const reportHeight = useHeightReporting();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    statements: [],
    location: null,
    date: '',
    time: '',
    therapist: null,
    service: null,
    personalData: { fullName: '', email: '', phone: '' }
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Report height when current step changes
  useEffect(() => {
    setTimeout(reportHeight, 200);
  }, [currentStep, reportHeight]);

  // Report height when form data changes (particularly for dynamic content)
  useEffect(() => {
    setTimeout(reportHeight, 100);
  }, [formData.location, formData.therapist, formData.service, reportHeight]);

  // Load initial data
  useEffect(() => {
    loadLocations();
    loadPersonnel();
    loadServices();
  }, []);

  // Load reservations when date changes
  useEffect(() => {
    if (formData.date) {
      loadReservations();
    }
  }, [formData.date]);

  // Calculate available time slots
  useEffect(() => {
    if (formData.location && formData.date) {
      calculateAvailableTimeSlots();
    }
  }, [formData.location, formData.date, personnel, reservations]);

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('nyirok_locations')
      .select('*');
    
    if (data && !error) {
      setLocations(data);
    }
  };

  const loadPersonnel = async () => {
    const { data, error } = await supabase
      .from('nyirok_personnel')
      .select('*');
    
    if (data && !error) {
      setPersonnel(data);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('nyirok_services')
      .select('*');
    
    if (data && !error) {
      setServices(data);
    }
  };

  const loadReservations = async () => {
    const { data, error } = await supabase
      .from('nyirok_reservations')
      .select('*')
      .eq('date', formData.date);
    
    if (data && !error) {
      setReservations(data);
    }
  };

  const requiresExpert = () => {
    return !formData.statements.includes("A fentiek közül egyik sem érvényes rám nézve");
  };

  const getAvailableTherapists = () => {
    if (!formData.location) return [];
    
    return personnel.filter(p => {
      // Must be assigned to selected location
      if (p.location_id !== formData.location?.id) return false;
      
      // If user requires expert, only show experts
      if (requiresExpert() && !p.expert) return false;
      
      return true;
    });
  };

  const calculateAvailableTimeSlots = () => {
    const availableTherapists = getAvailableTherapists();
    const available: string[] = [];

    TIME_SLOTS.forEach(timeSlot => {
      // Check if at least one therapist is available for this time slot
      const hasAvailableTherapist = availableTherapists.some(therapist => {
        return !reservations.some(reservation => 
          reservation.therapist_link === therapist.id && 
          reservation.time === timeSlot
        );
      });

      if (hasAvailableTherapist) {
        available.push(timeSlot);
      }
    });

    setAvailableTimeSlots(available);
  };

  const getAvailableTherapistsForTimeSlot = () => {
    if (!formData.time) return [];
    
    const availableTherapists = getAvailableTherapists();
    
    return availableTherapists.filter(therapist => {
      return !reservations.some(reservation => 
        reservation.therapist_link === therapist.id && 
        reservation.time === formData.time
      );
    });
  };

  const handleStatementChange = (statement: string) => {
    const isLastStatement = statement === "A fentiek közül egyik sem érvényes rám nézve";
    
    if (isLastStatement) {
      setFormData(prev => ({ ...prev, statements: [statement] }));
    } else {
      setFormData(prev => ({
        ...prev,
        statements: prev.statements.includes(statement)
          ? prev.statements.filter(s => s !== statement && s !== "A fentiek közül egyik sem érvényes rám nézve")
          : [...prev.statements.filter(s => s !== "A fentiek közül egyik sem érvényes rám nézve"), statement]
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(prev => prev + 1);
      // Report height after step change
      setTimeout(reportHeight, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Report height after step change
      setTimeout(reportHeight, 300);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.statements.length > 0;
      case 2: return formData.location !== null;
      case 3: return formData.date !== '';
      case 4: return formData.time !== '';
      case 5: return formData.therapist !== null;
      case 6: return formData.service !== null;
      case 7: return formData.personalData.fullName.trim() !== '' && 
                     formData.personalData.email.trim() !== '' && 
                     formData.personalData.phone.trim() !== '';
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.therapist || !formData.service || !formData.location) return;
    
    setLoading(true);
    
    const reservationData = {
      name: formData.personalData.fullName,
      email: formData.personalData.email,
      phone: formData.personalData.phone,
      date: formData.date,
      time: formData.time,
      location: formData.location.name,
      therapist: formData.therapist.name,
      therapist_link: formData.therapist.id,
      service: formData.service.name,
      notes: `Statements: ${formData.statements.join(', ')}`
    };

    const { error } = await supabase
      .from('nyirok_reservations')
      .insert([reservationData]);

    setLoading(false);

    if (!error) {
      alert('Foglalás sikeresen létrehozva!');
      // Reset form
      setFormData({
        statements: [],
        location: null,
        date: '',
        time: '',
        therapist: null,
        service: null,
        personalData: { fullName: '', email: '', phone: '' }
      });
      setCurrentStep(1);
    } else {
      alert('Hiba történt a foglalás során. Kérjük próbálja újra.');
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to 6, and adjust for Monday start
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    // Fix timezone issue by using local date string format
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    setFormData(prev => ({ ...prev, date: dateString }));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const today = new Date();
    const selectedDate = formData.date ? new Date(formData.date + 'T00:00:00') : null;
    
    const monthNames = [
      'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
      'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
    ];
    
    const dayNames = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = selectedDate && 
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate();
      const isToday = 
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-green-600 text-white'
              : isToday
              ? 'bg-green-100 text-green-600'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateCalendar('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateCalendar('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="h-10 w-10 flex items-center justify-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentStep / 8) * 100;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                  isActive ? 'bg-white border-green-600 text-green-600' : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-xs mt-2 text-center max-w-16">{step.title}</span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Nyilatkozat</h2>
              <p className="text-gray-600">Az időpontfoglalás előtt kérem jelölje be, ha az alábbiak közül valamelyik érvényes önre. Ez alapján az önnek leginkább megfelelő terapeutát tudjuk kiválasztani.</p>
            </div>
            <div className="space-y-3">
              {STATEMENTS.map((statement, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.statements.includes(statement) ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  onClick={() => handleStatementChange(statement)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.statements.includes(statement)}
                      onChange={() => {}}
                      className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label className={`text-gray-700 cursor-pointer ${index === STATEMENTS.length - 1 ? 'font-semibold' : ''}`}>
                      {statement}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz helyszínt</h2>
              <p className="text-gray-600">Hol szeretnéd igénybe venni a szolgáltatást?</p>
            </div>
            <div className="grid gap-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.location?.id === location.id ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, location }))}
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-green-600" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-800">{location.name}</h3>
                      <p className="text-gray-600 text-sm">{location.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz dátumot</h2>
              <p className="text-gray-600">Mikor szeretnél időpontot foglalni?</p>
            </div>
            <div className="flex justify-center">
              {renderCalendar()}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz időpontot</h2>
              <p className="text-gray-600">Milyen időpontban szeretnél időpontot?</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TIME_SLOTS.map((timeSlot) => {
                const isAvailable = availableTimeSlots.includes(timeSlot);
                return (
                  <div
                    key={timeSlot}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.time === timeSlot ? 'border-green-600 bg-green-50' : 
                      !isAvailable ? 'border-gray-200 bg-gray-100 cursor-not-allowed' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => isAvailable && setFormData(prev => ({ ...prev, time: timeSlot }))}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Clock size={16} className={isAvailable ? 'text-green-600' : 'text-gray-400'} />
                      <span className={`font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-400'}`}>
                        {timeSlot}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 5:
        const availableTherapists = getAvailableTherapistsForTimeSlot();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz terapeutát</h2>
              <p className="text-gray-600">Ki végezze el a kezelést?</p>
            </div>
            <div className="space-y-4">
              {availableTherapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.therapist?.id === therapist.id ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, therapist }))}
                >
                  <div className="flex items-start space-x-3">
                    <User className="text-green-600 mt-1" size={20} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800">{therapist.name}</h3>
                        {therapist.expert && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Szakértő
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{therapist.role}</p>
                      {therapist.description && (
                        <p className="text-gray-500 text-sm mt-1">{therapist.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz szolgáltatást</h2>
              <p className="text-gray-600">Melyik kezelést szeretnéd?</p>
            </div>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.service?.id === service.id ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, service }))}
                >
                  <div className="flex items-start space-x-3">
                    <Stethoscope className="text-green-600 mt-1" size={20} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{service.name}</h3>
                          {service.description && (
                            <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                          )}
                          <p className="text-gray-500 text-sm mt-1">{service.time} perc</p>
                        </div>
                        <span className="text-green-600 font-bold text-lg">
                          {service.price.toLocaleString()} Ft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Személyes adatok</h2>
              <p className="text-gray-600">Kérjük, adja meg az alábbi adatokat</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teljes név *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Adja meg a teljes nevét"
                  value={formData.personalData.fullName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalData: { ...prev.personalData, fullName: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail cím *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="pelda@email.hu"
                    value={formData.personalData.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalData: { ...prev.personalData, email: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonszám *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+36 30 123 4567"
                    value={formData.personalData.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalData: { ...prev.personalData, phone: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Összegzés</h2>
              <p className="text-gray-600">Ellenőrizd a foglalás adatait</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Helyszín</h4>
                  <p className="text-gray-900">{formData.location?.name}</p>
                  <p className="text-gray-600 text-sm">{formData.location?.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Időpont</h4>
                  <p className="text-gray-900">{formData.date}</p>
                  <p className="text-gray-600 text-sm">{formData.time}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Terapeuta</h4>
                  <p className="text-gray-900">{formData.therapist?.name}</p>
                  <p className="text-gray-600 text-sm">{formData.therapist?.role}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Szolgáltatás</h4>
                  <p className="text-gray-900">{formData.service?.name}</p>
                  <p className="text-gray-600 text-sm">{formData.service?.price.toLocaleString()} Ft</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-2">Személyes adatok</h4>
                  <p className="text-gray-900">{formData.personalData.fullName}</p>
                  <p className="text-gray-600 text-sm">{formData.personalData.email}</p>
                  <p className="text-gray-600 text-sm">{formData.personalData.phone}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white min-h-screen overflow-visible">
      <div className="max-w-4xl mx-auto p-6 bg-white overflow-visible">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 overflow-visible">
          {renderProgressBar()}
          
          <div className="min-h-96 bg-white overflow-visible">
            {renderStep()}
          </div>
          
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 bg-white">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
              <span>Vissza</span>
            </button>
            
            {currentStep === 8 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                {loading ? 'Foglalás...' : 'Foglalás véglegesítése'}
                <CheckCircle size={20} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Tovább</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
