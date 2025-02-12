import * as React from 'react';
import { Box, ButtonBase, Grid } from '@mui/material';
import { Paper, Toolbar } from '@mui/material';
import { IconButton } from '@mui/material';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TableContainer, Table, TableBody, TableCell, TableRow } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import ModeIcon from '@mui/icons-material/Mode';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArmorCard from './armor_card';
import WepCard from './wep_card';
import MantleCard from './mantle_card';
import SkillCard from './skill_card';
import SearchDialog from './search_equip';
import ToggleDialog from './effect_toggle';
import { getSharpnessColor, SharpnessBar } from '../src/sharpness';
import Sprite from './sprite';
import { doCalcs } from '../src/calcs';
import * as Equipment from '../src/equipment';
import * as Util from '../src/util';
import { Calcs } from './calcs';
import { AwakenedAbilities } from './safi';
import Augments from './augments';
import html2canvas from 'html2canvas';

function pushSkill(skillDict, skill) {
  const [id, lvl] = skill;
  if (!(id in skillDict)) {
    skillDict[id] = skill
  }
  else {
    skillDict[id][1] += lvl
  }
}

function applySkillLvlMax(data, skillDict) {
  for (const key in skillDict) {
    let [id, lvl] = skillDict[key];
    const s = data.skills[id];

    let secret = false;
    if ('Unlock' in s) {
      for (const i in s.Unlock) {
        const [u_id, u_lvl] = s.Unlock[i];
        if (u_id in skillDict) {
          if (skillDict[u_id][1] >= u_lvl) {
            secret = true;
            break;
          }
        }
      }
    }
    skillDict[key][2] = secret;

    let max = secret ? s.MaxSecret : s.Max;
    if (lvl >= max) {
      skillDict[key][1] = max;
      skillDict[key][3] = true;
    }
    if (lvl > max) {
      skillDict[key][3] = 2;
    }
    else if (lvl == max) {
      skillDict[key][3] = 1;
    }
    else {
      skillDict[key][3] = 0;
    }
  }
}

function skillSorter(data) {
  // Returns: 0 or 1
  function isSet(skill_id) {
    return data.skillColor[skill_id].Set;
  }

  // Returns: -1, 0, 1
  return function(a, b) {
    const [id_a, lvl_a] = a;
    const [id_b, lvl_b] = b;
    const sortBySet = isSet(id_b) - isSet(id_a);
    return sortBySet ? sortBySet : lvl_b - lvl_a;
  }
}

export default function Builder(data) {
  const screenshotRef = React.useRef(null);

  const takeScreenShot = () => {
    html2canvas(screenshotRef.current, {
      windowWidth: 1920,
      windowHeight: 1080,
      width: 1488,
      height: 927,
      scale: 1
    })
      .then(canvas => {
        let a = document.createElement('a');
        a.href = canvas.toDataURL("image/png");
        a.download = 'myfile.png';
        a.click();
      })
  };

  const [openSearch, setOpenSearch] = React.useState(false);
  const [equipItem, setEquipItem] = React.useState()
  const [searchClass, setSearchClass] = React.useState(0);

  // Opens the dialog according to an equipped item 'value'
  // if value is a weapon, default to searching for the same class
  const handleClickOpen = (value) => {
    if (value.Mode == 2) {
      setSearchClass(value.Wep.Class);
    }
    setEquipItem(value);
    setOpenSearch(true);
  };

  const [equip, setEquip] = React.useState({
    "Armor": {
      "0": data.armor[0],     // Head
      "1": data.armor[667],   // Chest
      "2": data.armor[1284],  // Arms
      "3": data.armor[1899],  // Waist
      "4": data.armor[2508],  // Legs
      "5": data.armor[3123]   // Charm
    },
    "Weapon": {...data.weapons[0][10], 'Class': 0},
    "Mantle": {
      "0": null,
      "1": null,
    }
  });

  // Due to slot-modifying upgrades (augments and safi), we have to handle
  // weapon slots separately to ensure persistence.
  const [myWepSlots, setMyWepSlots] = React.useState([...equip.Weapon.Slots]);

  const handleClose = (value) => {
    setOpenSearch(false);
    const args = [equip, setEquip, equipItem, value];
    switch(equipItem.Mode) {
      case 1:
        Equipment.setSlot(...args, myWepSlots, setMyWepSlots);
        break;
      case 2:
        Equipment.setWeapon(...args);
        break;
      case 3:
        Equipment.setMantle(...args);
        break;
      default:
        Equipment.setArmor(...args);
    }
  };

  const [myCusUpgrades, setMyCusUpgrades] = React.useState([null]);
  const [myAugments, setMyAugments] = React.useState([null]);
  const [myAwakens, setMyAwakens] = React.useState([null,null,null,null,null]);

  const [mySkills, setMySkills] = React.useState({});
  const [tglMap, setToggleMap] = React.useState(data.toggleMap);  // TODO: toggleList should contain the default toggle of ALL effects
  const [openTglDialog, setOpenTglDialog] = React.useState(false);

  React.useEffect(() => {
    setMyWepSlots([...equip.Weapon.Slots]);
    setMyCusUpgrades([null]);
    
    if (equip.Weapon.Rarity < 9) {
      setMyAugments(new Array(9 - equip.Weapon.Rarity).fill(null));
    }
    else {
      setMyAugments([null]);
    }
    setMyAwakens([null,null,null,null,null]);
  }, [equip.Weapon.Index])

  React.useEffect(() => {
    var tempSkills = {}
    let e = JSON.parse(JSON.stringify(equip))  // Deep clone
    Object.values(e.Armor).forEach(a => {
      if ('SetSkill' in a) {
        const s = [a.SetSkill, 1];
        pushSkill(tempSkills, s);
      }

      if ('Skills' in a) {
        a.Skills.forEach(s => pushSkill(tempSkills, s));
      }

      a.Slots.forEach(sl => {
        if (typeof(sl) != "number") {
          sl.Deco.Skills.forEach(s => pushSkill(tempSkills, s));
        }
      })
    });

    let w = e.Weapon;
    if ('Skill' in w) {
      const s = [w.Skill, 1];
      pushSkill(tempSkills, s);
    }

    let tempWepSlots = JSON.parse(JSON.stringify(myWepSlots));
    tempWepSlots.forEach(sl => {
      if (typeof(sl) != "number") {
        sl.Deco.Skills.forEach(s => pushSkill(tempSkills, s));
      }
    });

    applySkillLvlMax(data, tempSkills);
    setMySkills(tempSkills);
  }, [equip, myWepSlots]);

  const [myStats, setMyStats] = React.useState({});
  React.useEffect(() => {
    setMyStats(doCalcs(data, mySkills, tglMap, equip, myWepSlots, setMyWepSlots, myCusUpgrades, myAugments, myAwakens));
  }, [mySkills, tglMap, myCusUpgrades, myAugments, myAwakens])

  const theme = useTheme();
  const breakPoint = theme.breakpoints.values[
    [...theme.breakpoints.keys].reverse().reduce((output, key) => {
      const matches = useMediaQuery(theme.breakpoints.only(key));

      return !output && matches ? key : output;
    }, null) || 'xs'
  ]
  // Hacky fix for flex & minHeight
  var equipBlockStyle = (breakPoint < theme.breakpoints.values.lg) ? {} : {height: "1px", minHeight: `calc(85vh - 50px)`};
  var mantleWrap = (breakPoint > theme.breakpoints.values.lg) ? "nowrap" : "wrap";

  function MyWeaponDisplay(props) {
    let cardProps = {
      "main": true,
      "data": data,
      "wep": equip.Weapon,
      "wepSlots": myWepSlots,
      "onClick": handleClickOpen,
      "overrides": {
        "Damage": myStats.DisplayAttack,
        "Affinity": myStats.DisplayAffinity,
        "Defense": myStats.DisplayDefense,
        "EleDmg": myStats.DisplayEleDmg,
        "NatSharpBonus": myStats.NatSharpBonus,
        "SafiSharpBonus": myStats.SafiSharpBonus
      },
      "sx": { flexGrow: 1, mb: 0.5, p: 0.3}
    }
    if (myStats.WepVar1 || myStats.WepVar1 == 0) {
      cardProps.overrides.WepVar1 = myStats.WepVar1;
    }

    return(
      <WepCard
        {...cardProps}
      />
    )
  }

  const MyArmorDisplay = () => {
    const MyArmorCard = (props) => (
      <ArmorCard
        main data={data}
        armor={equip.Armor[props.type]}
        onClick={handleClickOpen}
        sx={{ flexGrow: 1, mb: 0.5, p: 0.3, height: 1}}
      />
    )
    return (
      Util.range(0,4).map(i => {
        return (
          <MyArmorCard type={i} key={i}/>
        )
      })
    )
  }

  const MyCharmDisplay = () => (
    <ArmorCard
      charm
      data={data}
      armor={equip.Armor[5]}
      onClick={handleClickOpen}
      sx={{p: 0.3}}
    />
  )

  return (
    <Box>
    {openSearch &&
      <SearchDialog
        data={data}
        open={openSearch}
        equipItem={equipItem}
        searchClass={searchClass}
        setSearchClass={setSearchClass}
        onClose={handleClose}
      />}

    {openTglDialog &&
      <ToggleDialog
        data={data}
        toggleMap={tglMap}
        setToggleMap={setToggleMap}
        open={openTglDialog}
        onClose={() => setOpenTglDialog(false)}
      />}

    <Box
      sx={{
        mb: 1,
        backgroundColor: 'primary.main',
      }}
    >
      <Toolbar variant="dense">
        <ModeIcon sx={{ mr: 2 }}/>
        <Typography variant="h5" flex={1}> New Set (placeholder) </Typography>
        <IconButton edge="start" color="inherit" aria-label="menu" onClick={takeScreenShot}>
          <PhotoCameraIcon />
        </IconButton>
      </Toolbar>
    </Box>

    <Box ref={screenshotRef}>
    <Grid backgroundColor="background.default" container wrap="wrap-reverse" spacing={1}>
      <Grid item xs={12} lg={2}>
          <Paper sx={{height: "85vh", overflow: 'auto', p: 0.3}}>
            {(() => {
                let e = JSON.parse(JSON.stringify(mySkills));
                return (
                  Object.values(e)
                  .sort(skillSorter(data))
                  .map(s => {
                    const [id, lvl] = s;
                    return (
                      <div key={id}>
                        <SkillCard data={data} skill={s} sx={{mb: 0.3}}/>
                      </div>
                    )
                  })
                )
            })()}
          </Paper>
      </Grid>

      <Grid item xs={12} lg={10}>
        <Paper
          sx={{
            width: "100%",
            p: 0.3,
            mb: 0.5
          }}
        >
          <ButtonBase
            onClick={() => setOpenTglDialog(true)}
            sx={{
              display: "flex",
              justifyContent: "left",
              width: "100%",
              minHeight: 42,
              p: 0.5,
              border: 1,
              borderRadius: 1,
              borderColor: 'text.secondary',
            }}
          >
              {Object.entries(data.toggleData).map((entry, i) => {
                const [key, item] = entry;
                let textColor = 'text.primary';
                if (tglMap[key]) {
                  if ('sprite' in item) {
                    return (
                      <Sprite
                        key={i}
                        {...item.sprite}
                      />
                    )
                  }
                  if ('src' in item) {
                    return (
                      <Box
                        key={i}
                        component="img"
                        src={item.src}
                      />
                    )
                  }
                  if ('nick' in item) {
                    if ('skill' in item && !(item.skill in mySkills)) {
                      textColor = 'text.disabled'
                    }
                    return (
                      <Box
                        key={i}
                        sx={{
                          ml: 0.5,
                          p: 0.3,
                          border: 1,
                          borderRadius: 1,
                          borderColor: 'text.disabled'
                        }}
                      >
                        <Typography variant='button' color={textColor}>
                          { item.nick }
                        </Typography>
                      </Box>
                    )
                  }
                }
              })}
          </ButtonBase>
        </Paper>

        <Grid container spacing={"0.5vh"}>
          <Grid item xs={12} md={8}>
            <Box display="flex" flexDirection="column" sx={equipBlockStyle}>
              <MyWeaponDisplay/>
              <MyArmorDisplay/>
              <Grid container spacing={0.3}>
                <Grid item xs={12} xl={4}>
                  <MyCharmDisplay/>
                </Grid>
                <Grid item xs>
                  <Grid container wrap={mantleWrap} spacing={0.3} height="100%">
                    <Grid item xl={6}>
                      <MantleCard main data={data} pos={0} mantle={equip.Mantle[0]} onClick={handleClickOpen} sx={{flex: 1, p: 0.3}}/>
                    </Grid>
                    <Grid item xl={6}>
                      <MantleCard main data={data} pos={1} mantle={equip.Mantle[1]} onClick={handleClickOpen} sx={{flex: 1, p: 0.3}}/>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* original height: 13vh + 0.5vh margin + 66vh */}
          <Grid item xs={12} md={4}>
            <Equipment.WepUpgradeDisplay
              data={data}
              equip={equip}
              setEquip={setEquip}
              upgrades={myCusUpgrades}
              setUpgrades={setMyCusUpgrades}
              awakens={myAwakens}
              setAwakens={setMyAwakens}
              augments={myAugments}
              setAugments={setMyAugments}
            />
            <Paper>
              { Object.keys(myStats).length != 0 &&
                <Calcs data={data} stats={myStats}/>
              }
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
    </Box>
    </Box>
  );
}
