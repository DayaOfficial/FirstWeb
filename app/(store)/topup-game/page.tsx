'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Zap } from 'lucide-react';

const games = [
  { id: 'ml', name: 'Mobile Legends', pub: 'Moonton', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrO3ian6CZZIsP4gYGo_L6vmcM8wOJdNB138X06adCpXnyNfxLfSEqgHaUFpnI2u5yd5CUjvQ-KIIQJ1ATMa3xVn0YJGwVLTWxI9qOtFwgDPRvUM0KXdcTHjKcSBfJeRIWr939tyhNsz86kqGzsWaFfBNFuGg9ZWl_LUeWV1mDmCYdYB9pN81lieK8pD5dahzIs8sb6YZ6fZ0keMfiu0t334ZC9sgdTBEXwrJ_9MwHGY4apPYV_RdXLaML-2z-X6Zvm6Bq0fBRO6U' },
  { id: 'ff', name: 'Free Fire', pub: 'Garena', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpCn0_4AfepUVpRZZQ3cceYDWU5b_e4sTIbsxrlpwKS7xJWu6nRIUoHC_cl3dnYbfacK8pUOFinM7bTGEYb0mZauDXxWdnB_kOXBdbRt9xT1M69JYh_4Lr-9GTgyANRwEhkEGIzJ0CN2zdx2QLRx7XcqjYXDcevEw_2lCtMg4rfj4y7ZDqtSJeLGlhstiGvFyyEHSUYONAJZad6iTpSimYl-QZw8yHPWStIwQomIPaXRG68ANyrYoHn3AOTVJA02t2JV2uWLu9AoU' },
  { id: 'gi', name: 'Genshin Impact', pub: 'HoYoverse', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9EhvRVBa3n_zwyvDw-NMToelNuN1_MHct2WnZw-ZkLtr5l6pUlmZSLibEEerKxi2gMUYCh6uebfAKA--kS7RzhAdS2XCiL6sfOUjmQWMF2stm5Lw0XXQ2C5qFXhtQbj0VsKbbmZpi0gpGpuD47fX8VsVD2d_wJDsdDCc96QkRToPWJYhji05cN1DWoZrmu5YOZCWGppkH08spr2ALt6oqf2wQ1A9lNP0qJ6B6yED_y8tWYXspM6SZC6qEFLsO7Nm2UJIx8fqNSII' },
  { id: 'vl', name: 'Valorant', pub: 'Riot Games', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT7t8Fn5Vx1b2sRIgKpPk6E45xUtSkIJvq8a1wlgw98_9jpaYlZHkRxANh7iLowmH7tJHCKpUZ_W8cONoviA18MZxjw_DTq_2pLuWmTyr1pjffsfJwYP9cVG79lQjfeuv8KHZerC4KlX0_UekLHuTKDbrlCiU8m9eUIreo6apZiT_mswTiE3Dt3twOLMszCcE0XWk1vMQTDjIWczLQNsl4sgld6reN57-dhPW6CidNUQTy7JVvRKkdg3tELrcTzHv50rwiUnz5Wl0' },
  { id: 'pb', name: 'PUBG Mobile', pub: 'Level Infinite', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4mrQ92IrgyIV0qDxE8dmrJ-u2qtdzxIRgVXBN__lDLi1OdVdUSTd4kN7DlBSCO2Qr0HuJrtQGQHINgMSu4V_v0qoEEF7kEE0bBA23V46v0I39_aN8a5NCxJQY0LuO4wNtuoU63woxyVy99qYaZmB4Q-I3eSq_1NutJQeq8Nd15P21cbAy7DH2eWw3LKzCXQzSEci6faHNkiH57oMuKSe6xXVPl_WURUeIWh_bP3zfkfAUKkUo1dIBG7hbtoRkg-ZUpZljkim--H8' },
  { id: 'rb', name: 'Roblox', pub: 'Roblox Corporation', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6KtOgwnT3jLWET7MrNt4Gudt7LGmSl9heb3VVhVvPN47ajRzqsVjV1WiTKBeKMvMYtV0Ty0btFJXDxc2R0V69AJXInJf80lnwKAca7-OaXrGJXGPnCzpTLPiM6RcMmIxVwY8YbgVqEDc1a3ABGmIT_10SMlsQ_wftxi0DuB-4FEX64AR9V2nLKS8RUaWpwlUgLYNzwx9WuGExTkO8frqcYlk08KcpGB2hAvOk6frZu4J7FBIMT2t3UwJlsWZsYr5CvqysVZSOYZQ' },
  { id: 'hsr', name: 'Honkai Star Rail', pub: 'HoYoverse', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8T-pH1ZQvfvG3gsvT_eTraHDaQAFYuj_ILG0wHmKAuEp39mGqMBZv6u1Y0Mf06xSCm2Ipl3x5yvLogVzZ-_PdziTuhK9case1yZVi6Svba6MkMjIupENquLiEY_n0kQLyjvmgj-N_4gnPCFLPR5ExW09WQfjEwIv52IBdQxLj4ni07T2BX4jVuqFDv9y9baWgphdgKIwQf0swgTY8ItnvW93Vrdu63PKnSU2Rk0rwGgBLCKn9INFymvBnJ2DzNAaX3YEmg9UwM2A' },
  { id: 'cod', name: 'Call of Duty Mobile', pub: 'Activision', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdDmjzILbTafst_2sDZSYUsyrLaWxeJ3q6QBybIS7dZiFkJZca25ZLkox1ZHYDTcLsLxHCJzMZVux-Lk57sZI8YKTiI3dHzhQqjVOU1G4StgrFiZuPdYupc69QSoftacoUK2FjXmFHM1_8N70o3F4c4NU4fczvB4tROAW23BXowR_B9QhWG9R2vwcQ7Bse1a5Rpl7EqxfUf97Oa2nJLW4pMPyLdZDaXc2WUa3vL0ydBpM9XPnhWQUovM_YBatmXN3MAIXHWb0qMHU' },
  { id: 'coc', name: 'Clash of Clans', pub: 'Supercell', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFxFcMH15Rf-m9nTqv4xOuwnzXi8l1k-vhI0oTbCo20DD7A8X2Ehv1a0c32UrKgnz8hvSuwFk_TO17Ry7wzAYEPERhHqAu7I14AcCe26MuWjuc1_ULFjtVrCdSmKzZMK2CfRw2TRKp_dPATL9ULUscrrAUbxkuisjAZ6pGRe-QEEJ81OAijVHyZhYtOPIsgOYgaxd9So8u4YzBT7mFuvBwIdaJWyt64AE0fF610O1txjBjI_97l9E5MBTrJP1M4DyMMHyxeI-GcW0' },
  { id: 'stm', name: 'Steam Wallet', pub: 'Valve', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGiQFpYfkW14sYQMtAcIlcfJLR_4Shyz8VVE_SzazSKPLVdTrmIfCTFOYj1ZaQrOiQ9FTIVGalX_2gsW7RCYh7txdvcR9qXXTvXlHAoVdAD8xIXVItKb0GCMU4q-KagplbxDIwneFzcA7eo2UZfjUA3qbrxvtZnjDB9jAAQDPisXvy_Xwmh79hMd4_SuG1PS6KV3m-oSmi_9Z8MZRwtXTNSMZ7uW3zbmAMykSs6d_EKK3Sp5sdLFTldAE0sYDE8JgdFMmzMyb8xQw' },
];

const filters = ['Semua', 'Populer', 'Mobile', 'PC', 'Console'];

export default function TopUpGamePage() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [search, setSearch] = useState('');

  const filtered = games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Top Up Game</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] mb-4">Top Up Game</h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari game favoritmu..."
              className="w-full bg-surface-container-highest border border-outline-variant rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${activeFilter === f
                  ? 'bg-primary text-white shadow-[0px_4px_15px_rgba(192,0,58,0.3)]'
                  : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(g => (
          <Link
            key={g.id}
            href={`/topup-game/${g.id}`}
            className="group bg-white rounded-2xl border border-surface-dim overflow-hidden shadow-soft shadow-hover-effect flex flex-col h-full cursor-pointer"
          >
            <div className="h-36 w-full relative overflow-hidden bg-surface-variant">
              <img src={g.img} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-on-surface leading-tight mb-0.5 group-hover:text-primary transition-colors">{g.name}</h3>
                <p className="text-xs text-on-surface-variant truncate">{g.pub}</p>
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-secondary bg-secondary-fixed/30 rounded-full px-2 py-1 w-fit">
                <Zap size={12} className="mr-0.5" />
                Proses Instan
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

