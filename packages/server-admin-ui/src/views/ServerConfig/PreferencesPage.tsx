import React from 'react'
import GnssPositionSettings from './GnssPositionSettings'
import UnitPreferencesSettings from './UnitPreferencesSettings'

const PreferencesPage: React.FC = () => {
  return (
    <div>
      <GnssPositionSettings />
      <UnitPreferencesSettings />
    </div>
  )
}

export default PreferencesPage
