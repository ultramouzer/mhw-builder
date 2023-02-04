import * as React from 'react';
import { Box, Grid } from '@mui/material';
import { Paper, Toolbar } from '@mui/material';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ModeIcon from '@mui/icons-material/Mode';
import update from 'immutability-helper';
import ArmorCard from './armor_card';
import WepCard from './wep_card';
import MantleCard from './mantle_card';
import SkillCard from './skill_card';
import SearchDialog from './search_equip';

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
    let max = secret ? s.MaxSecret : s.Max;

    if (lvl > max) {
      skillDict[key][1] = max;
    }
  }
}

export default function Builder(data) {
  const [open, setOpen] = React.useState(false);
  const [equipItem, setEquipItem] = React.useState()
  const [searchClass, setSearchClass] = React.useState(0);

  // Opens the dialog according to an equipped item 'value'
  // if value is a weapon, default to searching for the same class
  const handleClickOpen = (value) => {
    if (value.Mode == 2) {
      setSearchClass(value.Wep.Class);
    }
    setEquipItem(value);
    setOpen(true);
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

  const handleClose = (value) => {
    setOpen(false);

    // Set slot
    if (equipItem.Mode == 1) {
      if (equipItem.Type <= 5) {
        setEquip(update(equip, {
          Armor: {
            [equipItem.Type]: {
              Slots: {
                [equipItem.Pos]: {
                  $set: value
                }
              }
            }
          }
        }))
      }
      else if (equipItem.Type == 6) {
        setEquip(update(equip, {
          Weapon: {
            Slots: {
              [equipItem.Pos]: {
                $set: value
              }
            }
          }
        }))
      }
      else if (equipItem.Type == 7) {
        setEquip(update(equip, {
          Mantle: {
            [equipItem.Pos[0]]: {
              Slots: {
                [equipItem.Pos[1]]: {
                  $set: value
                }
              }
            }
          }
        }))
      }
    }
    // Set weapon
    else if (equipItem.Mode == 2) {
      setEquip(update(equip, {
        Weapon: {$set: value}
      }))
    }
    // Set mantle
    else if (equipItem.Mode == 3) {
      setEquip(update(equip, {
        Mantle: {
          [equipItem.Pos]: {
            $set: value
          }
        }
      }))
    }
    // Set armor
    else {
      setEquip(update(equip, {
        Armor: {
          [value.Type]: {$set: value}
        }
      }))
    }
  };

  const [mySkills, setMySkills] = React.useState({})
  const [toggleList, setToggleList] = React.useState([])  // TODO: toggleList should contain the default toggle of ALL effects

  React.useEffect(() => {
    var tempSkills = {}
    let e = JSON.parse(JSON.stringify(equip))  // Deep clone
    Object.values(e.Armor).forEach(a => {
      if ('SetSkill' in a) {
        const s = [a.SetSkill, 1];
        pushSkill(tempSkills, s);
      }

      if ('Skill' in a) {
        const s = [a.Skill, 1];
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
    w.Slots.forEach(sl => {
      if (typeof(sl) != "number") {
        sl.Deco.Skills.forEach(s => pushSkill(tempSkills, s));
      }
    });

    applySkillLvlMax(data, tempSkills);
    setMySkills(tempSkills);
  }, [equip]);

  const [calcs, setCalcs] = React.useState();

  React.useEffect(() => {
    let e = JSON.parse(JSON.stringify(mySkills));
    const classNo = 50;  // TODO: Set proper size
    let bonusBucket = Array.from(Array(classNo), () => new Array())
    for (const key in e) {
      if (key in data.skillBonus) {
        const bonuses = data.skillBonus[key];
        for (var i=0; i < bonuses.length; i++) {
          bonusBucket[bonuses[i].effect.class].push([key, bonuses[i]])
        }
      }
    }
    console.log(bonusBucket);

    // TODO: calcs w/ bucket
  }, [mySkills, toggleList])

  const theme = useTheme();
  const breakPoint = theme.breakpoints.values[
    [...theme.breakpoints.keys].reverse().reduce((output, key) => {
      const matches = useMediaQuery(theme.breakpoints.only(key));

      return !output && matches ? key : output;
    }, null) || 'xs'
  ]
  // Hacky fix for flex & minHeight
  var equipBlockStyle = (breakPoint < theme.breakpoints.values.md) ? {} : {height: "1px", minHeight: "76.5vh"};
  var mantleWrap = (breakPoint > theme.breakpoints.values.md) ? "nowrap" : "wrap";

  return (
    <div>

    <Box
      sx={{
        mb: 1,
        backgroundColor: 'primary.main',
      }}
    >
      <Toolbar>
        <ModeIcon sx={{ mr: 2 }}/>
        <Typography variant="h5"> New Set (placeholder) </Typography>
      </Toolbar>
    </Box>

    <Grid container wrap="wrap-reverse" spacing={1}>
      <Grid item xs={12} md={2.5}>
          <Paper sx={{height: "82vh", overflow: 'auto', p: 0.3}}>
            {(() => {
                let e = JSON.parse(JSON.stringify(mySkills));
                return (
                  Object.values(e)
                  .sort((a, b) => (b[1] - a[1]))
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

      <Grid item xs={12} md={9.5}>
          <Paper style={{height: "5vh", marginBottom: "0.5vh"}}>
            {/* Active effect icons */}
          </Paper>

          <Grid container spacing={"0.5vh"}>
            <Grid item xs={12} md={8}>
              <Box display="flex" flexDirection="column" sx={equipBlockStyle}>
                <WepCard main data={data} wep={equip.Weapon} onClick={handleClickOpen} sx={{ flexGrow: 1, mb: 0.5, p: 0.3}}/>
                <ArmorCard main data={data} armor={equip.Armor[0]} onClick={handleClickOpen} sx={{ flexGrow: 1, mb: 0.5,p:0.3}}/>
                <ArmorCard main data={data} armor={equip.Armor[1]} onClick={handleClickOpen} sx={{ flexGrow: 1, mb: 0.5, p: 0.3}}/>
                <ArmorCard main data={data} armor={equip.Armor[2]} onClick={handleClickOpen} sx={{ flexGrow: 1, mb: 0.5, p: 0.3}}/>
                <ArmorCard main data={data} armor={equip.Armor[3]} onClick={handleClickOpen} sx={{ flexGrow: 1, mb: 0.5, p: 0.3}}/>
                <ArmorCard main data={data} armor={equip.Armor[4]} onClick={handleClickOpen} sx={{ flexGrow: 1, mb: 0.5, p: 0.3}}/>
                <Grid container spacing={0.3}>
                  <Grid item xs={12} xl={4}>
                    <ArmorCard charm data={data} armor={equip.Armor[5]} onClick={handleClickOpen} sx={{p: 0.3}}/>
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

              {open &&
              <SearchDialog
                data={data}
                open={open}
                equipItem={equipItem}
                searchClass={searchClass}
                setSearchClass={setSearchClass}
                onClose={handleClose}
              />}
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper style={{height: "13vh", marginBottom: "0.5vh"}}>
                {/* Safi/Gun mod zone */}
              </Paper>
              <Paper style={{height: "63vh", padding: "1vh"}}>
                {/* Calcs */}
              </Paper>
            </Grid>
          </Grid>
      </Grid>
    </Grid>
    </div>
  );
}