'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import Link from 'next/link'
import { Phone, Lock, MapPin, Bed, IndianRupee, Home, LogIn, Mic, MicOff, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Marquee } from '@/components/ui/3d-testimonials'
import VaporizeTextCycle, { Tag } from '@/components/ui/vapour-text-effect'
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb'
import { Button } from '@/components/ui/button'
import { HeroSectionBackground } from '@/components/ui/hero-section-with-smooth-bg-shader'
import OutboundAgent from '@/components/agents/OutboundAgent'

interface Flat {
  property_id?: string
  property_code?: string
  title: string
  city?: string
  locality: string
  rent: string
  bedrooms?: string
  area_sqft?: string
  amenities?: string
  description?: string
  photos?: string
}

function FlatCard({ flat }: { flat: Flat }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-teal-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Card className="w-64 md:w-72 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="size-10">
            {flat.photos ? (
              <AvatarImage src={flat.photos.split(',')[0]} alt={flat.title} />
            ) : null}
            <AvatarFallback className={getRandomColor(flat.title)}>
              {getInitials(flat.title)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {flat.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{flat.locality}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4 text-homie-blue" />
              <span className="text-lg font-bold text-homie-blue">
                {flat.rent || 'N/A'}
              </span>
            </div>
            {flat.bedrooms && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span>{flat.bedrooms} BHK</span>
              </div>
            )}
          </div>
          {flat.area_sqft && (
            <div className="text-xs text-muted-foreground">
              {flat.area_sqft} sqft
            </div>
          )}
          {flat.amenities && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {flat.amenities}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [userType, setUserType] = useState<'tenant' | 'owner'>('tenant')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('1234')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Hardcoded flats data from flats.csv (first 5 rows)
  const flats: Flat[] = [
    {
      title: 'Sunrise Apartments',
      locality: 'Madhapur',
      rent: '25000',
      bedrooms: '2',
      area_sqft: '1200',
      amenities: 'Parking;Lift;Security;Gym',
      property_code: 'SUN-001'
    },
    {
      title: 'Green Valley Residency',
      locality: 'Gachibowli',
      rent: '30000',
      bedrooms: '2',
      area_sqft: '1400',
      amenities: 'Parking;Lift;Security;Gym;Swimming Pool',
      property_code: 'GV-001'
    },
    {
      title: 'Tech Park Homes',
      locality: 'Hitech City',
      rent: '20000',
      bedrooms: '1',
      area_sqft: '900',
      amenities: 'Parking;Lift;Security',
      property_code: 'TP-001'
    },
    {
      title: 'Elite Towers',
      locality: 'Banjara Hills',
      rent: '35000',
      bedrooms: '3',
      area_sqft: '1800',
      amenities: 'Parking;Lift;Security;Gym;Swimming Pool;Power Backup',
      property_code: 'ET-001'
    },
    {
      title: 'Modern Heights',
      locality: 'Jubilee Hills',
      rent: '22000',
      bedrooms: '1',
      area_sqft: '950',
      amenities: 'Parking;Lift;Security',
      property_code: 'MH-001'
    }
  ]

  const [showLoginForm, setShowLoginForm] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceDetected, setVoiceDetected] = useState(false)
  const [showOutboundAgent, setShowOutboundAgent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(phoneNumber, password || '1234', userType)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      // Trigger outbound call agent when starting
      setShowOutboundAgent(true)
      setIsRecording(true)
    } else {
      // Stop recording and hide agent
      setIsRecording(false)
      setShowOutboundAgent(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-homie-blue via-homie-blue-medium to-homie-blue-dark">
      {/* Login Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setShowLoginForm(!showLoginForm)}
          className="homie-gradient text-white shadow-lg hover:shadow-xl transition-all"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Login
        </Button>
      </div>


      {/* Section 1: Hero Banner - Vapour Effect */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-homie-blue via-homie-blue-medium to-homie-blue-dark relative z-10">
        <div className="w-full h-full flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-6xl h-[600px] flex items-center justify-center relative z-20" style={{ minHeight: '600px' }}>
            <div className="w-full h-full flex items-center justify-center relative z-20">
              <VaporizeTextCycle
                texts={["Long Listings&Hustle", "Futuristic Voice Agents"]}
                font={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "80px",
                  fontWeight: 700
                }}
                color="rgb(255, 255, 255)"
                spread={5}
                density={5}
                animation={{
                  vaporizeDuration: 2,
                  fadeInDuration: 1,
                  waitDuration: 0.5
                }}
                direction="left-to-right"
                alignment="center"
                tag={Tag.H1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Voice Module */}
      <section className="min-h-screen flex items-center justify-center relative z-10">
        {/* Mesh Gradient Background */}
        <HeroSectionBackground
          colors={["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe", "#2563eb", "#1d4ed8"]}
          distortion={0.8}
          swirl={0.6}
          speed={0.42}
          offsetX={0.08}
          veilOpacity="bg-white/10"
        />
        
        {/* Outbound Agent */}
        {showOutboundAgent && (
          <OutboundAgent
            calleeName="7095288950"
          />
        )}
        
        <div className="w-full h-full flex flex-col items-center justify-center px-4 py-12 space-y-8 relative z-10">
          {/* Orb */}
          <div className="w-96 h-96 relative">
            <VoicePoweredOrb
              enableVoiceControl={isRecording}
              className="rounded-xl overflow-hidden shadow-2xl"
              onVoiceDetected={setVoiceDetected}
              hue={260}
            />
          </div>
          
          {/* Control Button */}
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="px-8 py-3 bg-white/90 backdrop-blur-sm text-homie-blue hover:bg-white shadow-lg"
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 mr-3" />
                Call Conncted 
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-3" />
                Get a call
              </>
            )}
          </Button>
          
          {/* Instructions */}
          <p className="text-white/90 text-center max-w-md text-sm md:text-base">
            Click the button to enable voice control. Speak to see the orb respond to your voice with subtle movements.
          </p>
        </div>
      </section>

      {/* Section 3: Marquee Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-homie-blue via-homie-blue-medium to-homie-blue-dark relative z-10 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Confused on end listings?
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Welcome Homio
            </h3>
            <p className="text-white/80 text-sm md:text-base mt-4">
              Discover your perfect home from our curated collection
            </p>
          </div>

          {flats.length > 0 ? (
            <div className="border border-white/20 rounded-lg relative flex h-96 w-full max-w-[1200px] mx-auto flex-row items-center justify-center overflow-hidden gap-1.5 [perspective:300px] bg-white/10 backdrop-blur-sm">
              <div
                className="flex flex-row items-center gap-4"
                style={{
                  transform:
                    'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
                }}
              >
                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-1`} flat={flat} />
                  ))}
                </Marquee>

                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-2`} flat={flat} />
                  ))}
                </Marquee>

                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-3`} flat={flat} />
                  ))}
                </Marquee>

                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-4`} flat={flat} />
                  ))}
                </Marquee>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-homie-blue-dark"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-homie-blue-dark"></div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-homie-blue-dark"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-homie-blue-dark"></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <p className="text-white/80">No properties available at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Login Form Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full space-y-8 p-8 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 relative">
            <button
              onClick={() => setShowLoginForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-homie-blue to-homie-blue-light bg-clip-text text-transparent">
                Sign in to Homemates
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Login with your mobile number
              </p>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setUserType('tenant')
                  setError('')
                }}
                className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                  userType === 'tenant'
                    ? 'border-b-2 border-homie-blue text-homie-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tenant
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserType('owner')
                  setError('')
                }}
                className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                  userType === 'owner'
                    ? 'border-b-2 border-homie-blue text-homie-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Owner
              </button>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-homie-blue focus:border-homie-blue"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Default: 1234"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-homie-blue focus:border-homie-blue"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Default password: 1234
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white homie-gradient hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-homie-blue disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Signing in...' : `Sign in as ${userType === 'tenant' ? 'Tenant' : 'Owner'}`}
                </button>
              </div>

              <div className="text-center">
                <Link href="/register" className="text-sm text-homie-blue hover:text-homie-blue-dark">
                  Don't have an account? Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-homie-blue-dark via-homie-blue to-homie-blue-medium border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Homemates</h3>
              <p className="text-white/80 text-sm md:text-base mb-4">
                Your trusted partner in finding the perfect home. Experience the future of real estate with AI-powered voice agents.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://facebook.com/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://linkedin.com/company/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <a href="#properties" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    Properties
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+918035736726" className="hover:text-white transition-colors">
                    +91 8035736726
                  </a>
                </li>
                <li className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:info@homematesapp.in" className="hover:text-white transition-colors">
                    info@homematesapp.in
                  </a>
                </li>
                <li className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                  <MapPin className="h-4 w-4" />
                  <span>India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Homemates. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
