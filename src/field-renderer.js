(function (root) {
  "use strict";

  function render(template, onChange) {
    const controls = {};
    const displays = [];
    const slotRecords = [];
    let previousFacts = {};
    let mobileShowCompleted = false;
    const container = document.createElement("div");
    container.className = "panel sentence-form";
    if(template.choiceStyle==='cards')container.className+=' card-form';
    const uiProfile=root.UiProfile?.current?.()||'desktop';
    container.setAttribute('data-ui-profile',uiProfile);
    if(template.mobileFocusMode)container.setAttribute('data-mobile-focus','yes');

    function el(tag, text, className) {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    }

    function input(parent, key, label, type = "text") {
      const caption = el("label", label);
      caption.htmlFor = key;

      const control = el(type === "textarea" ? "textarea" : "input");
      control.id = key;
      control.autocomplete = "off";

      if (type === "textarea") control.rows = 2;
      else control.type = type;

      if (type === "number") {
        control.min = "0";
        control.step = "any";
      }

      controls[key] = control;
      parent.append(caption, control);

      return control;
    }

    function field(spec) {
      const wrap = el("span", "", "sentence-slot");

      if (spec.type === "computed" && spec.display) {
        const output=el("p"); output.id=spec.id; output.setAttribute("style","white-space: pre-line");
        wrap.append(el("span",spec.label),output);
        displays.push(facts=>{output.textContent=facts[spec.id]||"";});
      } else if (spec.type === 'time' && spec.timePicker) {
        const group=el('div');group.id=spec.id;
        const parts=spec.timePicker;
        const make=(suffix,count,label)=>{
          const select=el('select');select.id=spec.id+suffix;select.setAttribute('aria-label',spec.label+label);
          const empty=el('option',parts.empty);empty.value='';select.append(empty);
          for(let i=0;i<count;i++){const value=String(i).padStart(2,'0'),option=el('option',value);option.value=value;select.append(option);}
          select.value='';group.append(select,el('span',label));return select;
        };
        const hours=make('Hour',24,parts.hour),minutes=make('Minute',60,parts.minute);
        Object.defineProperty(group,'value',{get:()=>hours.value!==''&&minutes.value!==''?hours.value+':'+minutes.value:'',set:value=>{
          const valid=/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value||'');
          hours.value=valid?value.slice(0,2):'';minutes.value=valid?value.slice(3):'';
        }});
        controls[spec.id]=group;wrap.append(el('span',spec.label),group);
      } else if (spec.type === "fixed") {
        wrap.append(el("span", spec.value, "fixed-text"));

      } else if (spec.type === "checklist") {
        const group = el("fieldset", "", "choice-group");
        group.append(el("legend", spec.label));

        const boxes = [];

        for (const item of spec.items) {
          const label = el("label", "", "check-choice");
          const box = el("input");

          box.type = "checkbox";
          box.value = item.id;

          label.append(box, document.createTextNode(item.label));
          group.append(label);
          boxes.push(box);

          box.addEventListener("change", () => {
            if (!box.checked) return;
            if (item.exclusive) {
              boxes.forEach(other => { if (other !== box) other.checked = false; });
            } else {
              boxes.forEach((other, index) => {
                if (spec.items[index]?.exclusive) other.checked = false;
              });
            }
          });

          if (item.when) displays.push(facts => {
            box.disabled = !root.DraftEngine.matches(item.when, facts);
            label.hidden = box.disabled;
          });

          if (item.customKey) {
            const custom = el("span", "", "custom-slot");

            input(
              custom,
              item.customKey,
              item.customLabel
            );

            group.append(custom);

            displays.push(facts => {
              custom.hidden =
                !facts[spec.id]?.includes(item.id);
            });
          }
        }

        controls[spec.id] = {
          get value() {
            return boxes
              .filter(box => box.checked)
              .map(box => box.value);
          },

          set value(value) {
            boxes.forEach(box => {
              box.checked =
                Array.isArray(value) &&
                value.includes(box.value);
            });
          }
        };

        wrap.append(group);

      } else if (spec.type === "choiceGroup") {
        const group = el("fieldset", "", "choice-group");
        group.append(el("legend", spec.label));

        const radios = [];

        for (const option of [
          ...(spec.showUnanswered === false
            ? []
            : [{ id: "", label: "尚待確認" }]),
          ...spec.options
        ]) {
          const label = el("label", "", "check-choice");
          const radio = el("input");

          radio.type = "radio";
          radio.name = spec.id;
          radio.value = option.id;
          radio.checked = option.id === "";

          label.append(
            radio,
            document.createTextNode(option.label)
          );

          group.append(label);
          radios.push(radio);
        }

        controls[spec.id] = {
          get value() {
            return (
              radios.find(radio => radio.checked)?.value || ""
            );
          },

          set value(value) {
            radios.forEach(radio => {
              radio.checked = radio.value === value;
            });
          }
        };

        const items = el("fieldset", "", "choice-items");
        items.append(el("legend", spec.itemsLabel));

        const boxes = [];

        for (const item of spec.items) {
          const label = el("label", "", "check-choice");
          const box = el("input");

          box.type = "checkbox";
          box.value = item.id;

          label.append(
            box,
            document.createTextNode(item.label)
          );

          items.append(label);
          boxes.push(box);

          if (item.customKey) {
            const custom = el("span", "", "custom-slot");

            input(
              custom,
              item.customKey,
              item.customLabel
            );

            items.append(custom);

            displays.push(facts => {
              custom.hidden =
                !facts[spec.itemsKey]?.includes(item.id);
            });
          }
        }

        controls[spec.itemsKey] = {
          get value() {
            return boxes
              .filter(box => box.checked)
              .map(box => box.value);
          },

          set value(value) {
            boxes.forEach(box => {
              box.checked =
                Array.isArray(value) &&
                value.includes(box.value);
            });
          }
        };

        displays.push(facts => {
          items.hidden =
            !spec.options.find(
              option => option.id === facts[spec.id]
            )?.usesItems;

          items.disabled = items.hidden;

          for (const radio of radios) {
            const option = spec.options.find(
              item => item.id === radio.value
            );

            radio.disabled =
              !root.DraftEngine.matches(
                option?.when,
                facts
              );

            radio.parentElement.hidden =
              radio.disabled;
          }
        });

        group.append(items);
        wrap.append(group);

      } else if (
        ["select", "hour"].includes(spec.type)
      ) {
        const label = el("label", spec.label);
        label.htmlFor = spec.id;

        const options =
          spec.type === "hour"
            ? Array.from(
                { length: 24 },
                (_, hour) => ({
                  id: String(hour),
                  label: hour + spec.suffix
                })
              )
            : [
                ...spec.options,
                ...(spec.allowCustom === false
                  ? []
                  : [{
                      id: "custom",
                      label:
                        spec.customLabel ||
                        "其他，自行填寫"
                    }])
              ];

        const allOptions = template.choiceStyle==='cards'?options:[
          {
            id: "",
            label: "請選擇／尚待確認"
          },
          ...options
        ];
        const cards=template.choiceStyle==='cards'?root.ChoiceControls.single({id:spec.id,label:spec.label,options:allOptions,onChange:change}):null;
        const control=cards?cards.element:el('select');control.id=spec.id;controls[spec.id]=control;
        if(!cards)for (const option of allOptions) {
          const node = el(
            "option",
            option.label
          );

          node.value = option.id;
          control.append(node);
        }

        wrap.append(label, control);

        if (spec.type === "select") {
          displays.push(facts => {
            for (const node of control.options) {
              const option = spec.options.find(
                item =>
                  item.id === node.value
              );

              node.disabled = !!option?.disabled ||
                !root.DraftEngine.matches(
                  option?.when,
                  facts
                );

              node.hidden = node.disabled;
              if(spec.lockWhen&&root.DraftEngine.matches(spec.lockWhen,facts))node.disabled=true;
            }
            if(cards)cards.refresh();
          });

          if (spec.allowCustom !== false) {
            const custom = el(
              "span",
              "",
              "custom-slot"
            );

            input(
              custom,
              spec.id + "Custom",
              "自行填寫「" +
                spec.label +
                "」的文字",
              spec.customType === "number"
                ? "number"
                : "textarea"
            );

            if (spec.customReply) {
              input(
                custom,
                spec.id + "ReplyCustom",
                spec.customReplyLabel ||
                  "民眾回覆用字",
                "textarea"
              );
            }

            wrap.append(custom);

            displays.push(facts => {
              custom.hidden =
                facts[spec.id] !== "custom";
            });
          }
        }

      } else {
        const control = input(
          wrap,
          spec.id,
          spec.label,
          spec.inputType || spec.type
        );
        if(spec.lockWhen)displays.push(facts=>{control.readOnly=root.DraftEngine.matches(spec.lockWhen,facts);});
        if(spec.inputMode)control.inputMode=spec.inputMode;
        if(spec.placeholder)control.placeholder=spec.placeholder;
        if(spec.pattern)control.pattern=spec.pattern;
        if(spec.maxLength)control.maxLength=spec.maxLength;

        if (spec.type === "time") {
          control.step = "60";
        }

        if (spec.type === "number") {
          control.min = spec.min ?? "";
          control.step =
            spec.integer ? "1" : "any";
        }

        if (spec.suggestion) {
          const use = el(
            "button",
            "使用常用文字：" +
              spec.suggestion,
            "secondary"
          );

          use.type = "button";

          use.addEventListener(
            "click",
            () => {
              control.value =
                spec.suggestion;
              change();
            }
          );

          wrap.append(use);
        }
      }

      displays.push(facts => {
        wrap.hidden =
          !root.DraftEngine.matches(
            spec.showWhen,
            facts
          ) || !root.DraftEngine.matches(spec.displayWhen,facts);
      });

      slotRecords.push({spec,wrap});
      return wrap;
    }

    let mobileFocusButton=null;
    function updateMobileFocus(facts){
      const profile=root.UiProfile?.current?.()||uiProfile;
      container.setAttribute('data-ui-profile',profile);
      if(!template.mobileFocusMode||profile!=='mobile') {
        slotRecords.forEach(({wrap})=>{
          wrap.setAttribute('data-ui-hidden','no');
          wrap.setAttribute('data-ui-current','no');
          wrap.setAttribute('data-ui-completed','no');
        });
        if(mobileFocusButton)mobileFocusButton.hidden=true;
        return;
      }
      const visibleInputs=slotRecords.filter(({spec,wrap})=>!wrap.hidden&&!['computed','fixed'].includes(spec.type));
      const current=visibleInputs.find(({spec})=>!root.UiProfile.answered(spec,facts));
      let completed=0;
      slotRecords.forEach(({spec,wrap})=>{
        const isInput=!['computed','fixed'].includes(spec.type);
        const isComplete=isInput&&!wrap.hidden&&root.UiProfile.answered(spec,facts)&&(!current||spec.id!==current.spec.id);
        const isCurrent=!!current&&spec.id===current.spec.id;
        if(isComplete)completed++;
        wrap.setAttribute('data-ui-completed',isComplete?'yes':'no');
        wrap.setAttribute('data-ui-current',isCurrent?'yes':'no');
        wrap.setAttribute('data-ui-hidden',isComplete&&!mobileShowCompleted?'yes':'no');
      });
      if(mobileFocusButton){
        mobileFocusButton.hidden=completed===0;
        mobileFocusButton.textContent=mobileShowCompleted?'隱藏已完成步驟':`查看／修改已完成步驟（${completed}）`;
      }
    }

    // 填寫畫面只顯示欄位。
    // 「本局於……」、「派員前往……」等固定公文文字，
    // 僅在最後產生稽查紀錄／民眾回覆時出現。
    const formGrid = el(
      "div",
      "",
      "form-grid"
    );

    for (const spec of template.fields) {
      if (["fixed", "computed"].includes(spec.type) && !spec.display) continue;

      formGrid.append(field(spec));
    }

    if(template.mobileFocusMode){
      const focusBar=el("div","","mobile-focus-bar");
      mobileFocusButton=el("button","查看／修改已完成步驟","secondary");
      mobileFocusButton.type="button";
      mobileFocusButton.addEventListener("click",()=>{
        mobileShowCompleted=!mobileShowCompleted;
        updateMobileFocus(previousFacts);
      });
      focusBar.append(mobileFocusButton);
      container.append(focusBar);
    }
    container.append(formGrid);
    if (template.workflowStatus) {
      const status = el('p'); status.setAttribute('role', 'status');
      container.append(status);
      displays.push(facts => {
        status.textContent = template.validateOnSubmit&&template.workflowStatus===template.validationMessageField?'':facts[template.workflowStatus] || '';
        status.hidden = !status.textContent;
      });
    }

    function read() {
      return {...Object.fromEntries((template.persistedKeys||[]).map(key=>[key,previousFacts[key]??''])),...Object.fromEntries(
        Object.entries(controls).map(
          ([key, control]) => [
            key,
            control.value
          ]
        )
      )};
    }

    function write(inputValues) {
      const facts =
        root.DraftEngine.normalize(
          template,
          inputValues
        );

      for (
        const [key, control]
        of Object.entries(controls)
      ) {
        const value=facts[key]??'';
        // Avoid resetting caret/partial decimal input when normalization kept the raw string.
        if(JSON.stringify(control.value)!==JSON.stringify(value))control.value=value;
      }

      displays.forEach(update =>
        update(facts)
      );
      updateMobileFocus(facts);
      previousFacts = facts;

      return facts;
    }

    function change() {
      const workflow = root.TemplateWorkflows?.[template.workflow];
      const input = workflow?.resetChange ? workflow.resetChange(previousFacts, read()) : read();
      onChange(write(input));
    }

    container.addEventListener(
      "input",
      change
    );

    container.addEventListener(
      "change",
      change
    );

    write({});

    return {
      element: container,
      read,
      write
    };
  }

  root.FieldRenderer = {
    render
  };

})(
  typeof window === "undefined"
    ? globalThis
    : window
);
