import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MapPin, User, Stethoscope, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Mail, Phone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

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
  rank_name: string;
  location_id: string;
  service_ids: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  time: number;
  time_end: number;
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
    iranyitoszam: string;
    varos: string;
    utca: string;
    birthday: string;
  };
  paymentStatus: 'pending' | 'paid' | 'processing';
}

const STATEMENTS = [
  "Szív problémám vagy pacemakerem van",
  "Nem rég műtöttek vagy csonkolásos műtéten estem át", 
  "Nyílt vagy fekélyes sebem van",
  "Sztómával rendelkezem",
  "Kiskorú gyermek kezelését igénylem",
  "Onkológiai beteg vagyok",
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
  { id: 8, title: "Foglalás", icon: CreditCard },
  { id: 9, title: "Összegzés", icon: CheckCircle }
];

export default function ReservationSystem() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    statements: [],
    location: null,
    date: '',
    time: '',
    therapist: null,
    service: null,
    personalData: {
      fullName: '',
      email: '',
      phone: '',
      iranyitoszam: '',
      varos: '',
      utca: '',
      birthday: '',
    },
     paymentStatus: 'pending',
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const isMobile = useIsMobile();

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

  // Handle cross-window communication for payment
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our domain for security
      if (!event.origin.includes('mtzs0.github.io') && !event.origin.includes('localhost')) {
        return;
      }
      
      if (event.data.type === 'PAYMENT_SUCCESS' && event.data.sessionId) {
        console.log('Payment success received from popup:', event.data.sessionId);
        setPaymentSessionId(event.data.sessionId);
        handlePaymentReturn(event.data.sessionId);
      } else if (event.data.type === 'PAYMENT_CANCELLED') {
        console.log('Payment cancelled received from popup');
        setFormData(prev => ({ ...prev, paymentStatus: 'pending' }));
        toast({
          title: "Fizetés megszakítva",
          description: "Próbálja újra vagy válasszon másik fizetési módot.",
          variant: "destructive"
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      
      // If user requires expert, only show highest level therapists
      if (requiresExpert() && p.rank_name !== "Rehabilitációs nyirok terapeuta") return false;
      
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
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
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
      case 8: return true; // Payment step - button handles the logic
      default: return false;
    }
  };

  // Payment handling functions
  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log('Starting payment process with data:', formData);
      
      // Store reservation data in localStorage for retrieval after payment
      localStorage.setItem('reservation_data', JSON.stringify(formData));
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { reservationData: formData }
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Payment function failed');
      }

      if (!data?.url) {
        throw new Error('No payment URL received');
      }

      console.log('Payment URL received:', data.url);
      
      // Store the session ID for verification
      if (data.sessionId) {
        localStorage.setItem('stripe_session_id', data.sessionId);
        setPaymentSessionId(data.sessionId);
      }

      // Set processing status and open payment in new tab
      setFormData(prev => ({ ...prev, paymentStatus: 'processing' }));
      
      // Open Stripe Checkout in new tab for embedded compatibility
      const paymentWindow = window.open(data.url, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      if (!paymentWindow) {
        // Popup blocked - show fallback
        toast({
          title: "Felugró ablak blokkolva",
          description: "Kérjük engedélyezze a felugró ablakokat és próbálja újra.",
          variant: "destructive"
        });
        setFormData(prev => ({ ...prev, paymentStatus: 'pending' }));
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Fizetési hiba",
        description: `Hiba történt a fizetés során. Kérjük próbálja újra.`,
        variant: "destructive"
      });
      setFormData(prev => ({ ...prev, paymentStatus: 'pending' }));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentReturn = async (sessionId?: string) => {
    try {
      console.log('Processing payment return...');
      
      const finalSessionId = sessionId || localStorage.getItem('stripe_session_id') || paymentSessionId;
      const savedReservationData = localStorage.getItem('reservation_data');
      
      if (!finalSessionId) {
        console.error('No session ID found');
        throw new Error('Nincs fizetési azonosító');
      }

      // Use saved reservation data if available, otherwise use current formData
      const reservationData = savedReservationData ? JSON.parse(savedReservationData) : formData;
      console.log('Verifying payment with session ID:', finalSessionId);
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { 
          sessionId: finalSessionId,
          reservationData 
        }
      });

      if (error) {
        console.error('Payment verification error:', error);
        throw new Error(error.message || 'Payment verification failed');
      }

      console.log('Payment verification response:', data);

      if (data.success && data.paymentStatus === 'paid') {
        console.log('Payment successful, reservation created:', data.reservation);
        
        // Update form data if we used saved data
        if (savedReservationData) {
          setFormData(reservationData);
        }
        
        setReservationId(data.reservationId);
        setFormData(prev => ({ ...prev, paymentStatus: 'paid' }));
        setCurrentStep(9); // Move to summary step
        
        // Clean up localStorage
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('reservation_data');
      } else {
        throw new Error(data.message || 'Fizetés nem sikerült');
      }
    } catch (error) {
      console.error('Payment return error:', error);
      toast({
        title: "Ellenőrzési hiba",
        description: "Hiba történt a fizetés ellenőrzésekor. Kérjük próbálja újra.",
        variant: "destructive"
      });
      setFormData(prev => ({ ...prev, paymentStatus: 'pending' }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.therapist || !formData.service || !formData.location) return;
    
    setLoading(true);
    
    const reservationData = {
      name: formData.personalData.fullName,
      email: formData.personalData.email,
      phone: formData.personalData.phone,
      iranyitoszam: formData.personalData.iranyitoszam || null,
      varos: formData.personalData.varos || null,
      utca: formData.personalData.utca || null,
      birthday: formData.personalData.birthday || null,
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
      toast({
        title: "Sikeres foglalás",
        description: "Foglalása sikeresen létrehozva!",
      });
      // Reset form
      setFormData({
        statements: [],
        location: null,
        date: '',
        time: '',
        therapist: null,
        service: null,
        personalData: {
          fullName: '',
          email: '',
          phone: '',
          iranyitoszam: '',
          varos: '',
          utca: '',
          birthday: '',
        },
        paymentStatus: 'pending',
      });
      setCurrentStep(1);
    } else {
      toast({
        title: "Foglalási hiba",
        description: "Hiba történt a foglalás során. Kérjük próbálja újra.",
        variant: "destructive"
      });
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
    const progress = (currentStep / 9) * 100;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 overflow-x-auto">
          <div className="flex justify-between items-center w-full px-1 md:px-0 gap-1 md:gap-0">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              // On mobile, only show the current step
              if (isMobile && !isActive) {
                return null;
              }
              
              return (
                <div key={step.id} className={`flex flex-col items-center flex-shrink-0 min-w-0 ${isMobile ? 'flex-1' : 'flex-1 max-w-[12%] md:max-w-none'}`}>
                  <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                    isActive ? 'bg-white border-green-600 text-green-600' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <Icon size={10} className="md:w-4 md:h-4" />
                  </div>
                  <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-center leading-tight px-1">
                    {step.title}
                  </span>
                  {isMobile && (
                    <span className="text-[8px] text-gray-500 mt-1">
                      {currentStep} / {STEPS.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
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
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Nyilatkozat</h2>
              <p className="text-gray-600 text-sm">Az időpontfoglalás előtt kérem jelölje be, ha az alábbiak közül valamelyik érvényes önre. Ez alapján az önnek leginkább megfelelő terapeutát tudjuk kiválasztani.</p>
            </div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-4">
                  {STATEMENTS.map((statement, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${formData.statements.includes(statement) ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      onClick={() => handleStatementChange(statement)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.statements.includes(statement)}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label className={`text-gray-700 cursor-pointer text-sm ${index === STATEMENTS.length - 1 ? 'font-semibold' : ''}`}>
                          {statement}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz helyszínt</h2>
              <p className="text-gray-600">Hol szeretnéd igénybe venni a szolgáltatást?</p>
            </div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
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
              </ScrollArea>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz dátumot</h2>
              <p className="text-gray-600">Mikor szeretnél időpontot foglalni?</p>
            </div>
            <div className="flex-1 min-h-0 flex justify-center items-start pt-4">
              {renderCalendar()}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz időpontot</h2>
              <p className="text-gray-600">Milyen időpontban szeretnél időpontot?</p>
            </div>
            <div className="flex-1 min-h-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full content-start">
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
          </div>
        );

      case 5:
        const availableTherapists = getAvailableTherapistsForTimeSlot();
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz terapeutát</h2>
              <p className="text-gray-600">Ki végezze el a kezelést?</p>
            </div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
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
                            {therapist.rank_name && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {therapist.rank_name}
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
              </ScrollArea>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Válassz szolgáltatást</h2>
              <p className="text-gray-600">Melyik kezelést szeretnéd?</p>
            </div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
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
                              <p className="text-gray-500 text-sm mt-1">{service.time}-{service.time_end} perc</p>
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
              </ScrollArea>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Személyes adatok</h2>
              <p className="text-gray-600">Kérjük, adja meg az alábbi adatokat</p>
            </div>
            <div className="flex-1 min-h-0">
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
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Irányítószám
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="1234"
                      value={formData.personalData.iranyitoszam}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData(prev => ({
                          ...prev,
                          personalData: { ...prev.personalData, iranyitoszam: value }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Város
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Budapest"
                      value={formData.personalData.varos}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalData: { ...prev.personalData, varos: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Utca
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Példa utca 12."
                      value={formData.personalData.utca}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalData: { ...prev.personalData, utca: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Születési dátum
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="....-..-.. "
                    value={formData.personalData.birthday}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 4) {
                        value = value.substring(0, 4) + '-' + value.substring(4);
                      }
                      if (value.length >= 7) {
                        value = value.substring(0, 7) + '-' + value.substring(7, 9);
                      }
                      setFormData(prev => ({
                        ...prev,
                        personalData: { ...prev.personalData, birthday: value }
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Foglalás</h2>
              <p className="text-gray-600">Fizetés után véglegesítjük a foglalását</p>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                {formData.paymentStatus === 'processing' ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-lg">Fizetés feldolgozása...</p>
                  </>
                ) : (
                  <>
                    <CreditCard size={48} className="mx-auto text-blue-600" />
                    <p className="text-lg">Kérjük kattintson a "Fizetés" gombra a folytatáshoz</p>
                    <p className="text-gray-600">A fizetés egy új ablakban nyílik meg</p>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Összegzés</h2>
              <p className="text-gray-600">Hamarosan emailben továbbítjuk önnek a foglalás részleteit.</p>
            </div>
            <div className="flex-1 min-h-0">
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200" style={{ height: '900px' }}>
          {renderProgressBar()}
          
          <div className="bg-white" style={{ height: '537px' }}>
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
                onClick={handlePayment}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {loading ? 'Fizetés...' : 'Fizetés'}
                <CreditCard size={20} />
              </button>
            ) : currentStep === 9 ? (
              null
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
