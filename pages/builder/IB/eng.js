import * as React from 'react';
import Container from '@mui/material/Container';
import NavBar from '../../../components/navbar';
import Builder from '../../../components/mhw';

// Common
import weapons from '../../../data/IB/common/wepData.json';
import phials from '../../../data/IB/common/phials.json';
import sharpness from '../../../data/IB/common/kire.json';
import armor from '../../../data/IB/common/armor.json';
import decos from '../../../data/IB/common/decos.json';
import skills from '../../../data/IB/common/skills.json';
import skillBonus from '../../../data/IB/common/skill_bonus';

// Lang
import weaponString from '../../../data/IB/eng/wepStr.json';
import armorString from '../../../data/IB/eng/armorStr.json';
import decoString from '../../../data/IB/eng/decoStr.json';
import skillString from '../../../data/IB/eng/skillStr.json';

export default function IB() {
    const data = {
        weapons: weapons,
        weaponString: weaponString,
        phials: phials,
        sharpness: sharpness,
        armor: armor,
        armorString: armorString,
        decos: decos,
        decoString: decoString,
        skills: skills,
        skillString: skillString,
        skillBonus: skillBonus,
    }

    React.useEffect(() => {
        document.title = "IB Builder"
     }, []);

    return (
        <div>
            <title>IB Builder</title>
            <NavBar IB msg="IB Builder"/>
            <Container maxWidth="xl">
                { Builder(data) }
            </Container>
        </div>
    );
}