using GitVibe.Core.Models;
using GitVibe.Styles;
using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Branching;

public class BranchingView(List<GitBranch> branches, int selectedIndex = -1, int scrollOffset = 0, int pageSize = 10) : Renderable
{
    public static int GetSelectedRowIndex(List<GitBranch> branches, int selectedIndex)
    {
        if (selectedIndex == -1 || branches.Count == 0) return 0;
        return selectedIndex; // Branching view is 1:1 items to rows for now
    }
    public static int GetTotalRows(List<GitBranch> branches)
    {
        if (branches.Count == 0) return 1;
        return branches.Count;
    }

    protected override IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var table = new Table()
            .Expand()
            .Border(TableBorder.None)
            .HideHeaders();

        table.AddColumn("Pointer", c => c.Width(1).NoWrap());
        table.AddColumn("Active", c => c.Width(1).NoWrap());
        table.AddColumn("Branch Name");
        table.AddColumn("Status", c => c.Width(10).NoWrap());

        if (branches.Count == 0)
        {
            table.AddRow(Text.Empty, Text.Empty, new Markup("[grey]No branches found.[/]"), Text.Empty);
        }
        else
        {
            var rows = new List<Action<Table>>();
            for (int i = 0; i < branches.Count; i++)
            {
                var branch = branches[i];
                var index = i;
                rows.Add(t => {
                    var isSelected = index == selectedIndex;
                    var pointer = isSelected ? (IRenderable)new Markup("[bold blue]>[/]") : Text.Empty;
                    var style = isSelected ? "on blue" : "";

                    var activeIcon = branch.IsActive ? $"[green]{VibeTheme.StagedIcon}[/]" : " ";
                    var nameColor = branch.IsRemote ? VibeTheme.Dimmed : (branch.IsActive ? VibeTheme.Staged : "white");
                    var branchIcon = branch.IsRemote ? VibeTheme.RemoteIcon : VibeTheme.BranchIcon;

                    var fullStyle = string.IsNullOrEmpty(style) ? nameColor : $"{nameColor} {style}";
                    var nameMarkup = $"[{fullStyle}]{branchIcon} {Markup.Escape(branch.Name)}[/]";

                    var statusMarkup = "";
                    if (branch.AheadCount > 0) statusMarkup += $"[green]{VibeTheme.AheadIcon}{branch.AheadCount}[/] ";
                    if (branch.BehindCount > 0) statusMarkup += $"[yellow]{VibeTheme.BehindIcon}{branch.BehindCount}[/]";

                    if (isSelected && !string.IsNullOrEmpty(statusMarkup))
                    {
                        statusMarkup = $"[{style}]{statusMarkup}[/]";
                    }

                    t.AddRow(
                        pointer,
                        new Markup(activeIcon),
                        new Markup(nameMarkup),
                        new Markup(statusMarkup)
                    );
                });
            }

            foreach (var row in rows.Skip(scrollOffset).Take(pageSize))
            {
                row(table);
            }
        }

        return ((IRenderable)table).Render(options, maxWidth);
    }
}
