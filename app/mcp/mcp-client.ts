import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import {
  FunctionResponsePart,
  GoogleGenAI,
  type Content,
  type Tool
} from "@google/genai"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
dotenv.config()

interface IMCPTextExtractor {
  getTextContent(content: unknown): string
  isTextContent(item: unknown): item is {
    type: "text"
    text: string
  }
}

class MCPTextExtractor implements IMCPTextExtractor {

  //Type guard to safely validate and narrow an unknown item from an MCP tool response into a structured text object: { type: "text", text: string }.
  isTextContent(
    item: unknown
  ): item is { type: "text"; text: string } {
    return (
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "text" &&
      "text" in item &&
      typeof (item as any).text === "string"
    )
  }
  
  //Extracts and validates the text string from an MCP tool response content array.
  getTextContent(content: unknown): string {
    if (!Array.isArray(content)) {
      throw new Error("MCP tool returned an invalid content list.")
    }
    const textContent = content.find(
      (item: { type: "text"; text: string }) =>
        this.isTextContent(item)
    )
    if (!textContent) {
      throw new Error("MCP tool response did not contain text.")
    }
    return textContent.text
  }
}

class MCPOrchestrator {
  private mcpClient: Client | null = null
  private transport: StdioClientTransport | null = null
  private geminiTools: Tool[] = []
  private ai: GoogleGenAI
  private mcpTextExtractor: IMCPTextExtractor
  constructor(mcpTextExtractor: IMCPTextExtractor) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.")
    this.ai = new GoogleGenAI({ apiKey })
    this.mcpTextExtractor = mcpTextExtractor
  }
  public async init() {
    const projectRoot = fileURLToPath(
      new URL("../../", import.meta.url)
    )
    const serverEntry = fileURLToPath(
      new URL("./mcp-server.ts", import.meta.url)
    )
    this.transport = new StdioClientTransport({
      command: process.platform === "win32" ? "npx.cmd" : "npx",
      args: ["tsx", serverEntry],
      cwd: projectRoot
    })
    this.mcpClient = new Client(
      { name: "backend-orchestrator", version: "1.0.0" },
      { capabilities: {} }
    )
    await this.mcpClient.connect(this.transport)
    console.log("Orchestrator: Connected succesfully to MCP Server.")
    const { tools: mcpTools } = await this.mcpClient.listTools()
    this.geminiTools = [
      {
        functionDeclarations: mcpTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parametersJsonSchema: tool.inputSchema
        }))
      }
    ]
  }
  public async askGemini(userPrompt: string) {
    if (!this.mcpClient) {
      throw new Error("MCP Client is not initialized.")
    }
    console.log(`\n[Orchestrator] Recieved prompt: ${userPrompt}`)
    const conversationHistory: Content[] = [
      { role: "user", parts: [{ text: userPrompt }] }
    ]
    let toolUsedCount = 0
    let lastToolName = ""
    while (true) {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: conversationHistory,
        config: { tools: this.geminiTools }
      })
      const functionCalls = response.functionCalls ?? []
      if (functionCalls.length === 0) {
        return {
          reply: response.text,
          toolUsed: toolUsedCount > 0,
          toolName: lastToolName
        }
      }
      conversationHistory.push({
        role: "model",
        parts: functionCalls.map((call) => ({ functionCall: call }))
      })
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          if (!call.name) return null
          lastToolName = call.name
          toolUsedCount++

          console.log(
            `[Orchestrator] Executing MCP tool: [${call.name}] with arguments:`,
            call.args
          )

          const mcpResult = await this.mcpClient!.callTool({
            name: call.name,
            arguments: call.args ?? {}
          })

          const toolOutputText = this.mcpTextExtractor.getTextContent(
            mcpResult.content
          )
          return {
            functionResponse: {
              name: call.name,
              response: {
                result: toolOutputText,
                ...(mcpResult.isError ? { error: true } : {})
              }
            }
          } as FunctionResponsePart
        })
      )
      conversationHistory.push({
        role: "user",
        parts: functionResponses.filter(
          Boolean
        ) as FunctionResponsePart[]
      })
    }
  }
}
const mcpTextExtractor = new MCPTextExtractor()
export const orchestrator = new MCPOrchestrator(mcpTextExtractor)
orchestrator
  .init()
  .then(() => console.log("Orchestrator running on localhost..."))
  .catch((err) =>
    console.log("Could not turn on the orchestrator.", err)
  )
