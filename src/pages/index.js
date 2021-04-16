import * as React from "react"
import { Button, Card, Col, Divider, Input, message, Row, Select, Upload } from "antd"
import { UploadOutlined } from "@ant-design/icons"
import xliff from "xliff"

const { Option } = Select
const IndexPage = () => {
  const [sourceContent, setSourceContent] = React.useState(null)
  const [targetContent, setTargetContent] = React.useState(null)
  const [sourceLanguage, setSourceLanguage] = React.useState("lt")
  const [targetLanguage, setTargetLanguage] = React.useState("en")
  const targetForm = {}

  const onChange = (info) => {
    if (info.file.status === "done") {
      message.success(`Failas ${info.file.name} įkeltas sėkmingai.`)
    } else if (info.file.status === "error") {
      message.error(`Failo ${info.file.name} nepavyko įkelti.`)
    }
  }

  const onFileUpload = (event) => {
    try {
      const file = event.file
      const fileReader = new FileReader()
      fileReader.readAsText(file)
      fileReader.onload = () => {
        xliff.xliff2js(fileReader.result, (err, res) => {
          if (err) {
            throw new Error(err)
          }
          console.log(res)
          Object.keys(res.resources.ngi18n).forEach((id) => {
            if (typeof res.resources.ngi18n[id].source !== "string") {
              res.resources.ngi18n[id].target = res.resources.ngi18n[id].source
            } else {
              res.resources.ngi18n[id].target = ""
            }
          })
          setSourceContent(res)
          setTargetContent(res)
          event.onSuccess(null, {
            status: 200
          })
        })
      }
    } catch (e) {
      event.onError({
        method: "POST",
        url: "void",
        status: 500,
        message: e.message
      }, null)
    }
  }

  const languages = [
    "lt",
    "en",
    "ru",
    "de",
    "pl"
  ]

  const createTargetFile = () => {
    const updatedTargetContent = JSON.parse(JSON.stringify(targetContent))
    Object.entries(targetForm).forEach((values) => {
      if (updatedTargetContent.resources.ngi18n[values[0]]) {
        updatedTargetContent.resources.ngi18n[values[0]].target = targetForm[values[0]]
      }
    })

    xliff.js2xliff(updatedTargetContent, (err, res) => {
      if (err) {
        message.error(`Įvyko nenumatyta klaida.`)
      } else {
        const element = document.createElement("a")
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(res))
        element.setAttribute("download", `messages-${targetLanguage}.xlf`)

        element.style.display = "none"
        document.body.appendChild(element)

        element.click()

        document.body.removeChild(element)
      }
    })
  }

  return (
    <React.Fragment>
      <Card title="XLF failo pateikimas" style={{ width: "100%" }}>
        <Upload
          name={"file"}
          onChange={($event) => onChange($event)}
          maxCount={1}
          customRequest={($event) => onFileUpload($event)}
          multiple={false}>
          <Button icon={<UploadOutlined/>}>Įkelti xlf failą</Button>
        </Upload>
        <Divider/>
        {(sourceContent && targetContent) &&
        <React.Fragment>
          <Row gutter={[32, 32]}>
            <Col span={12}>
              <label>Verčiama iš:</label>
              <Select style={{ width: "100%" }} value={sourceLanguage} onChange={($event) => setSourceLanguage($event)}>
                {languages.map((l, i) => {
                  return (
                    <Option value={l} key={i}>{l}</Option>
                  )
                })}
              </Select>
            </Col>
            <Col span={12}>
              <label>Verčiama į:</label>
              <Select style={{ width: "100%" }} value={targetLanguage} onChange={($event) => setTargetLanguage($event)}>
                {languages.map((l, i) => {
                  return (
                    <Option value={l} key={i}>{l}</Option>
                  )
                })}
              </Select>
            </Col>
          </Row>
          <br/>
          {Object.keys(sourceContent.resources.ngi18n).map((id, index) => {
            const source = sourceContent.resources.ngi18n[id]
            const target = targetContent.resources.ngi18n[id]
            if (typeof source.source !== "string") {
              return null
            }
            return (
              <Row key={index} gutter={[32, 32]}>
                <Col span={12}>
                  <Input value={source.source} readOnly/>
                </Col>
                <Col span={12}>
                  <Input value={targetForm[id]} onKeyUp={($event) => targetForm[id] = $event.target.value}/>
                </Col>
              </Row>
            )
          })}
          <br/>
          <Button style={{ float: "right" }} type="primary" onClick={() => createTargetFile()}>Sugeneruoti vertimo
            failą</Button>
        </React.Fragment>
        }
      </Card>
    </React.Fragment>
  )
}

export default IndexPage
