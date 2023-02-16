import { getSharpness, getSharpnessMod } from "./sharpness";

function isToggled(bonus, tglMap){
  return (!('tglId' in bonus) || tglMap[bonus.tglId]);
}

function meetsCond(bonus, val) {
  return (!('cond' in bonus) || bonus.cond(val));
}

function getEffectiveRaw(calcs) {
  let critMod = 1 + (calcs.Affinity/100)*(calcs.CritDmg/100 - 1)
  return calcs.Attack * critMod * calcs.SharpMod[0];
}

function getEffectiveElement(calcs) {
  let critModifier = 1;
  if (calcs.Affinity > 0) {
    critModifier = (1 + (calcs.Affinity/100)*(calcs.EleCritDmg/100 - 1));
  }
  return calcs.EleDmg * critModifier * calcs.SharpMod[1];
}

export function doCalcs(data, mySkills, tglMap, equip) {
  const classNo = 50;  // TODO: Set proper size
  let bonusBucket = Array.from(Array(classNo), () => new Array());
  data.skillDefault.forEach(s => {
    if (isToggled(s, tglMap)) {
      bonusBucket[s.effect.class].push([-1, s]);
    }
  })

  let e = JSON.parse(JSON.stringify(mySkills));
  for (const key in e) {
    if (key in data.skillBonus) {
      const bonuses = data.skillBonus[key];
      bonuses.forEach(s => {
        if (isToggled(s, tglMap)) {
          bonusBucket[s.effect.class].push([key, s])
        }
      })
    }
  }

  let calcs = {
    "Attack": equip.Weapon.Damage,
    "Affinity": equip.Weapon.Affinity,
    "CritDmg": 125,
    "EleCritDmg": 100,
  }

  if ('Element' in equip.Weapon) {
    calcs.Element = equip.Weapon.Element;
    calcs.EleDmg = equip.Weapon.ElementDmg;
  }
  else if ('HiddenEle' in equip.Weapon && 47 in mySkills) {
    calcs.Element = equip.Weapon.Element;
    const [_, lvl] = mySkills[47];
    calcs.EleDmg = equip.Weapon.HiddenEleDmg * (lvl/3);
  }
  else {
    calcs.Element = 0;
    calcs.EleDmg = 0;
  }

  if (174 in mySkills && mySkills[174][1] >= 4) {
    calcs.EleCritDmg = data.trueCritEleMults[equip.Weapon.Class];
  }
  else if (165 in mySkills) {
    calcs.EleCritDmg = data.critEleMults[equip.Weapon.Class];
  }

  let rawCap = calcs.Attack * data.attackCap;
  if (211 in mySkills && mySkills[211][1] >= 3) {  // Safi caps
    // TODO: Apply bowgun caps
    if (calcs.Element >= 6) {
      if (mySkills[211][1] == 5) {
        var eleDmgCap = calcs.EleDmg * 2;
      }
      else {
        var eleDmgCap = calcs.EleDmg * 1.7;
      }
    }
    else {
      if (mySkills[211][1] == 5) {
        var eleDmgCap = calcs.EleDmg * 2.55;
      }
      else {
        var eleDmgCap = calcs.EleDmg * 2.2;
      }
    }
  }
  else {
    var eleDmgCap = Math.max(calcs.EleDmg * data.elementCap[0],
                             calcs.EleDmg + data.elementCap[1]);
  }

  if (54 in mySkills) {
    calcs.Handicraft = mySkills[54][1];
  }
  else {
    calcs.Handicraft = 0;
  }
  calcs.Sharpness = getSharpness(data, equip.Weapon, calcs.Handicraft);
  calcs.SharpMod = getSharpnessMod(calcs.Sharpness);

  for (var i=0; i < classNo; i++) {
    var sum = 0;
    var mult = 1;
    const bonusPackage = bonusBucket[i];
    switch(i) {
      case 12:
        bonusPackage.forEach(s => {
          const [id, bonus] = s;
          if (meetsCond(bonus, calcs.EleDmg)) {
            if ('param' in bonus.effect) {
              const lvl = mySkills[id][1];
              mult *= (data.skills[id].Params[lvl - 1][bonus.effect.param]/100);
            }
            else if ('value' in bonus.effect) {
              mult *= (bonus.effect.value/100);
            }
          }
        })
        calcs.Attack *= mult;
        break;
      case 13:
        bonusPackage.forEach(s => {
          const [id, bonus] = s;
          if ('param' in bonus.effect) {
            const lvl = mySkills[id][1];
            sum += data.skills[id].Params[lvl - 1][bonus.effect.param];
          }
          else if ('value' in bonus.effect) {
            sum += bonus.effect.value;
          }
        })
        calcs.Attack += sum;
        if (calcs.Attack > rawCap) {
          calcs.Attack = rawCap;
        }
        break;
      case 14:
        // TODO: Post-cap attack mult
        calcs.Attack *= mult;
        calcs.Attack = Math.round(calcs.Attack);
        break;
      case 15:
        bonusPackage.forEach(s => {
          const [id, bonus] = s;
          if ('param' in bonus.effect) {
            const lvl = mySkills[id][1];
            sum += data.skills[id].Params[lvl - 1][bonus.effect.param];
          }
          else if ('cusParam' in bonus.effect) {
            const lvl = mySkills[id][1];
            sum += bonus.effect.cusParam[lvl - 1];
          }
          else if ('value' in bonus.effect) {
            sum += bonus.effect.value;
          }
        })
        calcs.Affinity += sum;
        break;
      case 16:
        bonusPackage.forEach(s => {
          const [id, bonus] = s;
          const lvl = mySkills[id][1];
          calcs.CritDmg = data.skills[id].Params[lvl - 1][bonus.effect.param];
        })
        break;
      case 17:
        bonusPackage.forEach(s => {
          const [id, bonus] = s;
          if (meetsCond(bonus, calcs.Element)) {
            const lvl = mySkills[id][1];
            mult *= (data.skills[id].Params[lvl - 1][bonus.effect.param]/100);
          }
        })
        calcs.EleDmg *= mult;
        break;
      case 18:
        bonusPackage.forEach(s => {
          const [id, bonus] = s;
          if (meetsCond(bonus, calcs.Element)) {
            if ('param' in bonus.effect) {
              const lvl = mySkills[id][1];
              sum += data.skills[id].Params[lvl - 1][bonus.effect.param];
            }
            else if ('cusParam' in bonus.effect) {
              const lvl = mySkills[id][1];
              sum += bonus.effect.cusParam[lvl - 1];
            }
            else if ('value' in bonus.effect) {
              sum += bonus.effect.value;
            }
          }
        })
        calcs.EleDmg += sum;
        break;
      case 19:
        // TODO: pre-cap ele mult
        calcs.EleDmg *= mult;
        if (calcs.EleDmg > eleDmgCap) {
          calcs.EleDmg = eleDmgCap;
        }
        break;
      case 20:
        // TODO: post-cap ele mult
        calcs.EleDmg *= mult;
        calcs.EleDmg = Math.round(calcs.EleDmg);
        break;
    }
  }
  calcs.RawAffinity = calcs.Affinity;
  calcs.Affinity = Math.min(100, calcs.RawAffinity);
  calcs.EffRaw = getEffectiveRaw(calcs);
  calcs.EffEle = getEffectiveElement(calcs);

  return calcs;
}